import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { localeRoutes } from '../src/i18n/routing.ts';
import { startBuildServer } from './build-server.mjs';
import { generateOpenGraphImages } from './generate-og-images.mjs';
import { generatePdfs } from './generate-pdf.mjs';
import { PAGINATION_TEST_LOCALES } from './pdf-test-contract.mjs';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST_DIRECTORY = resolve(PROJECT_ROOT, 'dist');
const paginationTest = process.argv.includes('--pagination-test');
const pdfOnly = paginationTest || process.argv.includes('--pdf-only');
const locales = paginationTest ? PAGINATION_TEST_LOCALES : localeRoutes().map(({ locale }) => locale);
const buildServer = await startBuildServer(DIST_DIRECTORY);
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await generatePdfs(context, buildServer, locales, { paginationTest });

  if (!pdfOnly) {
    await generateOpenGraphImages(context, buildServer, DIST_DIRECTORY, locales);
  }
} finally {
  await Promise.allSettled([browser?.close(), buildServer.close()]);
}
