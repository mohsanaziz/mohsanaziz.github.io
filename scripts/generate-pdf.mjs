import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { localeDirection, localeRoutes, localeUrlSegment, resumeFileName, resumePath } from '../src/i18n/routing.ts';
import { startBuildServer } from './build-server.mjs';
import { PAGINATION_TEST_LOCALES } from './pdf-test-contract.mjs';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST_DIRECTORY = resolve(PROJECT_ROOT, 'dist');
const paginationTest = process.argv.includes('--pagination-test');
const CSS_PIXELS_PER_MILLIMETER = 96 / 25.4;
const A4_PAGE_SIZE_MILLIMETERS = { width: 210, height: 297 };
// Keep this value synchronized with the @page margin in src/pages/[...locale]/cv-print.astro.
const PAGE_MARGIN_MILLIMETERS = 8;
const PRINTABLE_PAGE_SIZE = {
  width: Math.floor((A4_PAGE_SIZE_MILLIMETERS.width - 2 * PAGE_MARGIN_MILLIMETERS) * CSS_PIXELS_PER_MILLIMETER),
  height: Math.floor((A4_PAGE_SIZE_MILLIMETERS.height - 2 * PAGE_MARGIN_MILLIMETERS) * CSS_PIXELS_PER_MILLIMETER),
};
const TYPOGRAPHY_TIERS = [
  { name: 'XL', scale: 1.3 },
  { name: 'L', scale: 1.15 },
  { name: 'M', scale: 1 },
];
const PRINT_FONT_BY_LOCALE = {
  ar: { family: 'Noto Sans Arabic' },
};

function pdfPath(locale) {
  return join(DIST_DIRECTORY, resumePath(locale));
}

function printablePagePath(locale) {
  const segment = localeUrlSegment(locale);

  return `/${segment === undefined ? '' : `${segment}/`}cv-print`;
}

function generationTarget(locale) {
  const pagePath = printablePagePath(locale);

  if (paginationTest) {
    return {
      locale,
      pagePath: `${pagePath}?test-volume=pagination`,
      pdfPath: resolve(PROJECT_ROOT, 'tmp/pagination-test', resumeFileName(locale)),
    };
  }

  return { locale, pagePath, pdfPath: pdfPath(locale) };
}

function footerTemplate(locale) {
  return `<div lang="${locale}" dir="${localeDirection(locale)}" style="box-sizing: border-box; width: 100%; padding: 0 8mm; transform: translateY(-11px); color: #5c574e; font-family: Arial, sans-serif; font-size: 6px; text-align: end;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>`;
}

async function selectTypographyTier(page) {
  return page.evaluate(
    ({ printablePageHeight, tiers }) => {
      const printDocument = document.querySelector('.print-document');

      if (!(printDocument instanceof HTMLElement)) {
        throw new Error('Unable to find the printable CV document.');
      }

      let selectedTier = tiers.at(-1);

      for (const tier of tiers) {
        printDocument.style.setProperty('--print-type-scale', String(tier.scale));

        if (printDocument.getBoundingClientRect().height <= printablePageHeight) {
          selectedTier = tier;
          break;
        }
      }

      return selectedTier;
    },
    { printablePageHeight: PRINTABLE_PAGE_SIZE.height, tiers: TYPOGRAPHY_TIERS },
  );
}

async function inflatePaginationTestVolume(page) {
  await page.evaluate(() => {
    if (new URLSearchParams(window.location.search).get('test-volume') !== 'pagination') {
      throw new Error('The pagination test volume parameter is missing.');
    }

    const experienceContent = document.querySelector('.experience-content');

    if (!(experienceContent instanceof HTMLElement)) {
      throw new Error('Unable to find the printable experience content.');
    }

    const sourceGroups = Array.from(experienceContent.querySelectorAll(':scope > .employer-group'));

    if (sourceGroups.length === 0) {
      throw new Error('Unable to find employer groups for the pagination test.');
    }

    const appendTestMarker = (element, marker) => {
      if (!(element instanceof HTMLElement)) return;

      const markerElement = document.createElement('span');
      markerElement.dir = 'ltr';
      markerElement.textContent = ` ${marker}`;
      element.append(markerElement);
    };

    for (const [groupIndex, sourceGroup] of sourceGroups.entries()) {
      const testGroup = sourceGroup.cloneNode(true);

      if (!(testGroup instanceof HTMLElement)) continue;

      const employerTestId = String(groupIndex + 1);
      const employerHeading = testGroup.querySelector('.employer-heading h3');
      const employerPeriod = testGroup.querySelector('.employer-banner > p:last-child');
      const employerHeadingId = `pagination-test-employer-${employerTestId}`;

      testGroup.setAttribute('aria-labelledby', employerHeadingId);

      if (employerHeading instanceof HTMLElement) {
        employerHeading.id = employerHeadingId;
      }

      appendTestMarker(employerHeading, `PAGINATION_TEST_EMPLOYER_START_${employerTestId}`);
      appendTestMarker(employerPeriod, `PAGINATION_TEST_EMPLOYER_END_${employerTestId}`);

      const missions = testGroup.querySelector('.missions');

      if (missions instanceof HTMLElement) {
        const sourceMissions = Array.from(missions.querySelectorAll('.mission-release'));

        for (const sourceMission of sourceMissions) {
          missions.append(sourceMission.cloneNode(true));
        }
      }

      for (const [missionIndex, mission] of testGroup.querySelectorAll('.mission-release').entries()) {
        const missionTestId = `${employerTestId}.${missionIndex + 1}`;
        const missionHeading = mission.querySelector('.mission-header h4');
        const missionEnvironment = mission.querySelector('.mission-environment');

        appendTestMarker(missionHeading, `PAGINATION_TEST_MISSION_START_${missionTestId.replace('.', '_')}`);
        appendTestMarker(missionEnvironment, `PAGINATION_TEST_MISSION_END_${missionTestId.replace('.', '_')}`);
      }

      experienceContent.append(testGroup);
    }
  });
}

async function assertPrintFont(page, locale) {
  const requiredFont = PRINT_FONT_BY_LOCALE[locale];

  if (requiredFont === undefined) return;

  const result = await page.evaluate(({ family }) => {
    const printDocument = document.querySelector('.print-document');
    const printFooter = document.querySelector('.print-footer-copy');

    if (!(printDocument instanceof HTMLElement) || !(printFooter instanceof HTMLElement)) {
      throw new Error('Unable to find the printable CV document and footer.');
    }

    const normalizedFirstFamily = (element) =>
      getComputedStyle(element)
        .fontFamily.split(',')[0]
        .trim()
        .replace(/^['"]|['"]$/g, '');
    const arabicTextTargets = [];

    for (const root of [printDocument, printFooter]) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let textNode;

      while ((textNode = walker.nextNode())) {
        const arabicCharacters = textNode.textContent?.match(/\p{Script=Arabic}/gu)?.join('') ?? '';
        const element = textNode.parentElement;

        if (arabicCharacters && element) {
          arabicTextTargets.push({
            sample: arabicCharacters,
            family: normalizedFirstFamily(element),
            target: `${element.tagName.toLowerCase()}.${element.className}`,
          });
        }
      }
    }

    const sample = [...new Set(arabicTextTargets.flatMap(({ sample }) => [...sample]))].join('');
    const declaredFaces = Array.from(document.fonts).filter((fontFace) => fontFace.family.trim().replace(/^['"]|['"]$/g, '') === family);
    const mismatches = arabicTextTargets.filter((target) => target.family !== family);

    return {
      applied: arabicTextTargets.length > 0 && mismatches.length === 0,
      declared: declaredFaces.length > 0,
      mismatches,
      loaded: declaredFaces.some((fontFace) => fontFace.status === 'loaded') && document.fonts.check(`1em "${family}"`, sample),
    };
  }, requiredFont);

  if (!result.declared) {
    throw new Error(`The required print font "${requiredFont.family}" is not declared for locale "${locale}".`);
  }

  if (!result.applied) {
    throw new Error(
      `The required print font "${requiredFont.family}" is loaded but not applied to every Arabic text node for locale "${locale}": ${JSON.stringify(result.mismatches)}.`,
    );
  }

  if (!result.loaded) {
    throw new Error(`The required print font "${requiredFont.family}" is unavailable for locale "${locale}".`);
  }
}

async function generatePdf(context, buildServer, { locale, pagePath, pdfPath }) {
  const page = await context.newPage();
  const loadingErrors = [];

  try {
    page.on('requestfailed', (request) => loadingErrors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', (response) => {
      if (response.status() >= 400) {
        loadingErrors.push(`${response.request().method()} ${response.url()}: HTTP ${response.status()}`);
      }
    });

    const response = await page.goto(`${buildServer.origin}${pagePath}`, { waitUntil: 'networkidle' });

    if (!response?.ok()) {
      throw new Error(`The printable CV returned HTTP ${response?.status() ?? 'unknown'}.`);
    }

    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    if (loadingErrors.length > 0) {
      throw new Error(`The printable CV did not load completely:\n${loadingErrors.join('\n')}`);
    }

    await assertPrintFont(page, locale);

    if (paginationTest) {
      await inflatePaginationTestVolume(page);
    }

    const typographyTier = await selectTypographyTier(page);
    await page.evaluate((tierName) => {
      document.title = `${document.title} [${tierName}]`;
    }, typographyTier.name);

    const session = await context.newCDPSession(page);
    const { data } = await session.send('Page.printToPDF', {
      displayHeaderFooter: true,
      footerTemplate: footerTemplate(locale),
      headerTemplate: '<div></div>',
      preferCSSPageSize: true,
      printBackground: true,
    });

    await mkdir(dirname(pdfPath), { recursive: true });
    await writeFile(pdfPath, Buffer.from(data, 'base64'));

    return typographyTier;
  } finally {
    await page.close();
  }
}

async function generatePdfs(locales) {
  const buildServer = await startBuildServer(DIST_DIRECTORY);
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: PRINTABLE_PAGE_SIZE });

    for (const locale of locales) {
      const target = generationTarget(locale);
      const typographyTier = await generatePdf(context, buildServer, target);

      console.log(`Generated ${target.pdfPath} with typography tier ${typographyTier.name} (×${typographyTier.scale})`);
    }
  } finally {
    await Promise.allSettled([browser?.close(), buildServer.close()]);
  }
}

await generatePdfs(paginationTest ? PAGINATION_TEST_LOCALES : localeRoutes().map(({ locale }) => locale));
