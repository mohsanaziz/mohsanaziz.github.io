import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { startBuildServer } from './build-server.mjs';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST_DIRECTORY = resolve(PROJECT_ROOT, 'dist');
const PDF_PATH = resolve(DIST_DIRECTORY, 'cv/CV.pdf');
const PAGINATION_TEST_PDF_PATH = resolve(PROJECT_ROOT, 'tmp/pagination-test/CV.pdf');
const PACKAGE_PATH = resolve(PROJECT_ROOT, 'package.json');
const paginationTest = process.argv.includes('--pagination-test');
const generationTarget = paginationTest
  ? { pagePath: '/cv-print?test-volume=pagination', pdfPath: PAGINATION_TEST_PDF_PATH }
  : { pagePath: '/cv-print', pdfPath: PDF_PATH };
const CSS_PIXELS_PER_MILLIMETER = 96 / 25.4;
const A4_PAGE_SIZE_MILLIMETERS = { width: 210, height: 297 };
// Keep this value synchronized with the @page margin in src/pages/cv-print.astro.
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
        employerHeading.append(` [début test pagination employeur ${employerTestId}]`);
      }

      if (employerPeriod instanceof HTMLElement) {
        employerPeriod.append(` [fin test pagination employeur ${employerTestId}]`);
      }

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

        if (missionHeading instanceof HTMLElement) {
          missionHeading.append(` [début test pagination mission ${missionTestId}]`);
        }

        if (missionEnvironment instanceof HTMLElement) {
          missionEnvironment.append(` [fin test pagination mission ${missionTestId}]`);
        }
      }

      experienceContent.append(testGroup);
    }
  });
}

async function generatePdf({ pagePath, pdfPath }) {
  const { version } = JSON.parse(await readFile(PACKAGE_PATH, 'utf8'));
  const buildServer = await startBuildServer(DIST_DIRECTORY);
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: PRINTABLE_PAGE_SIZE });
    const page = await context.newPage();
    const loadingErrors = [];

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

    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    if (loadingErrors.length > 0) {
      throw new Error(`The printable CV did not load completely:\n${loadingErrors.join('\n')}`);
    }

    if (paginationTest) {
      await inflatePaginationTestVolume(page);
    }

    await page.emulateMedia({ media: 'print' });
    const typographyTier = await selectTypographyTier(page);
    await page.evaluate((tierName) => {
      document.title = `${document.title} — palier ${tierName}`;
    }, typographyTier.name);

    const session = await context.newCDPSession(page);
    const { data } = await session.send('Page.printToPDF', {
      displayHeaderFooter: true,
      footerTemplate: `<div style="box-sizing: border-box; width: 100%; padding: 0 8mm; color: #5c574e; font-family: Arial, sans-serif; font-size: 6px; text-align: center;">Généré depuis mohsanaziz.github.io · v${version} — page <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
      headerTemplate: '<div></div>',
      preferCSSPageSize: true,
      printBackground: true,
    });

    await mkdir(dirname(pdfPath), { recursive: true });
    await writeFile(pdfPath, Buffer.from(data, 'base64'));

    return typographyTier;
  } finally {
    await Promise.allSettled([browser?.close(), buildServer.close()]);
  }
}

const typographyTier = await generatePdf(generationTarget);

console.log(`Generated ${generationTarget.pdfPath} with typography tier ${typographyTier.name} (×${typographyTier.scale})`);
