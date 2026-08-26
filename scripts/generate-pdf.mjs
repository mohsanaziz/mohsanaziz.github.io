import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { localeDirection, localePagePath, resumeFileName, resumePath } from '../src/i18n/routing.ts';
import { withLoadedBuildPage } from './capture-build-page.mjs';
import { paginationTestMarker } from './pdf-test-contract.mjs';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST_DIRECTORY = resolve(PROJECT_ROOT, 'dist');
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
  return localePagePath(locale, 'cv-print');
}

function generationTarget(locale, paginationTest) {
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

async function paginationTestMarkersForPage(page) {
  const sourceMissionCounts = await page.evaluate(() => {
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

    return sourceGroups.map((sourceGroup) => {
      const missions = sourceGroup.querySelector('.missions');

      if (!(missions instanceof HTMLElement)) {
        throw new Error('Unable to find an employer mission list for the pagination test.');
      }

      const missionCount = missions.querySelectorAll('.mission-release').length;

      if (missionCount === 0) {
        throw new Error('Unable to find employer missions for the pagination test.');
      }

      return missionCount;
    });
  });

  return sourceMissionCounts.map((sourceMissionCount, groupIndex) => {
    const employerTestId = String(groupIndex + 1);

    return {
      employer: {
        start: paginationTestMarker('start', 'employer', employerTestId),
        end: paginationTestMarker('end', 'employer', employerTestId),
      },
      missions: Array.from({ length: sourceMissionCount * 2 }, (_, missionIndex) => {
        const missionTestId = `${employerTestId}.${missionIndex + 1}`;

        return {
          start: paginationTestMarker('start', 'mission', missionTestId),
          end: paginationTestMarker('end', 'mission', missionTestId),
        };
      }),
    };
  });
}

async function inflatePaginationTestVolume(page) {
  const markerGroups = await paginationTestMarkersForPage(page);

  await page.evaluate((markerGroups) => {
    const experienceContent = document.querySelector('.experience-content');

    if (!(experienceContent instanceof HTMLElement)) {
      throw new Error('Unable to find the printable experience content.');
    }

    const sourceGroups = Array.from(experienceContent.querySelectorAll(':scope > .employer-group'));

    if (sourceGroups.length !== markerGroups.length) {
      throw new Error('The pagination test employer groups changed while preparing the fixture.');
    }

    const appendTestMarker = (element, marker) => {
      if (!(element instanceof HTMLElement)) {
        throw new Error(`Unable to attach pagination test marker "${marker}".`);
      }

      const markerElement = document.createElement('span');
      markerElement.dir = 'ltr';
      markerElement.textContent = ` ${marker}`;
      element.append(markerElement);
    };

    for (const [groupIndex, sourceGroup] of sourceGroups.entries()) {
      const testGroup = sourceGroup.cloneNode(true);
      const markers = markerGroups[groupIndex];

      if (!(testGroup instanceof HTMLElement)) {
        throw new Error('Unable to clone an employer group for the pagination test.');
      }

      const employerTestId = String(groupIndex + 1);
      const employerHeading = testGroup.querySelector('.employer-heading h3');
      const employerPeriod = testGroup.querySelector('.employer-banner > p:last-child');
      const employerHeadingId = `pagination-test-employer-${employerTestId}`;

      testGroup.setAttribute('aria-labelledby', employerHeadingId);

      if (!(employerHeading instanceof HTMLElement)) {
        throw new Error('Unable to find an employer heading for the pagination test.');
      }

      employerHeading.id = employerHeadingId;
      appendTestMarker(employerHeading, markers.employer.start);
      appendTestMarker(employerPeriod, markers.employer.end);

      const missions = testGroup.querySelector('.missions');

      if (!(missions instanceof HTMLElement)) {
        throw new Error('Unable to find a cloned employer mission list for the pagination test.');
      }

      const sourceMissions = Array.from(missions.querySelectorAll('.mission-release'));

      for (const sourceMission of sourceMissions) {
        missions.append(sourceMission.cloneNode(true));
      }

      const testMissions = Array.from(testGroup.querySelectorAll('.mission-release'));

      if (testMissions.length !== markers.missions.length) {
        throw new Error(`The pagination test mission count changed for employer ${employerTestId}.`);
      }

      for (const [missionIndex, mission] of testMissions.entries()) {
        const missionMarkers = markers.missions[missionIndex];
        const missionHeading = mission.querySelector('.mission-header h4');
        const missionEnvironment = mission.querySelector('.mission-environment');

        appendTestMarker(missionHeading, missionMarkers.start);
        appendTestMarker(missionEnvironment, missionMarkers.end);
      }

      experienceContent.append(testGroup);
    }
  }, markerGroups);
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

async function generatePdf(context, buildServer, { locale, pagePath, pdfPath }, paginationTest) {
  return withLoadedBuildPage(
    context,
    buildServer,
    { label: `The printable CV for locale "${locale}"`, pagePath, viewport: PRINTABLE_PAGE_SIZE, media: 'print' },
    async (page) => {
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
    },
  );
}

export async function generatePdfs(context, buildServer, locales, { paginationTest = false } = {}) {
  for (const locale of locales) {
    const target = generationTarget(locale, paginationTest);
    const typographyTier = await generatePdf(context, buildServer, target, paginationTest);

    console.log(`Generated ${target.pdfPath} with typography tier ${typographyTier.name} (×${typographyTier.scale})`);
  }
}
