import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST_DIRECTORY = resolve(PROJECT_ROOT, 'dist');
const PDF_PATH = resolve(DIST_DIRECTORY, 'cv/CV.pdf');
const PACKAGE_PATH = resolve(PROJECT_ROOT, 'package.json');
const CSS_PIXELS_PER_MILLIMETER = 96 / 25.4;
const PRINTABLE_PAGE_SIZE = {
  width: Math.floor(194 * CSS_PIXELS_PER_MILLIMETER),
  height: Math.floor(281 * CSS_PIXELS_PER_MILLIMETER),
};
const TYPOGRAPHY_TIERS = [
  { name: 'XL', scale: 1.3 },
  { name: 'L', scale: 1.15 },
  { name: 'M', scale: 1 },
];

const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
]);

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl ?? '/', 'http://localhost').pathname);
  const relativePath = pathname.replace(/^\/+/, '');
  const documentPath = extname(relativePath) ? relativePath : `${relativePath.replace(/\/$/, '')}/index.html`;
  const absolutePath = resolve(DIST_DIRECTORY, documentPath);

  if (absolutePath !== DIST_DIRECTORY && !absolutePath.startsWith(`${DIST_DIRECTORY}${sep}`)) {
    throw new Error(`Path outside the build directory: ${pathname}`);
  }

  return absolutePath;
}

function startBuildServer() {
  const server = createServer(async (request, response) => {
    try {
      const filePath = resolveRequestPath(request.url);
      const fileStats = await stat(filePath);

      if (!fileStats.isFile()) {
        throw new Error(`Not a file: ${filePath}`);
      }

      const contents = await readFile(filePath);

      response.writeHead(200, {
        'content-length': fileStats.size,
        'content-type': CONTENT_TYPES.get(extname(filePath)) ?? 'application/octet-stream',
      });

      if (request.method === 'HEAD') {
        response.end();
        return;
      }

      response.end(contents);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });

  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Unable to determine the build server address.'));
        return;
      }

      resolveServer({
        origin: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((resolveClose, rejectClose) => server.close((error) => (error ? rejectClose(error) : resolveClose()))),
      });
    });
  });
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

      printDocument.dataset.typographyTier = selectedTier.name;

      return selectedTier;
    },
    { printablePageHeight: PRINTABLE_PAGE_SIZE.height, tiers: TYPOGRAPHY_TIERS },
  );
}

async function generatePdf() {
  const { version } = JSON.parse(await readFile(PACKAGE_PATH, 'utf8'));
  const buildServer = await startBuildServer();
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

    const response = await page.goto(`${buildServer.origin}/cv-print`, { waitUntil: 'networkidle' });

    if (!response?.ok()) {
      throw new Error(`The printable CV returned HTTP ${response?.status() ?? 'unknown'}.`);
    }

    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    if (loadingErrors.length > 0) {
      throw new Error(`The printable CV did not load completely:\n${loadingErrors.join('\n')}`);
    }

    await page.emulateMedia({ media: 'print' });
    const typographyTier = await selectTypographyTier(page);

    const session = await context.newCDPSession(page);
    const { data } = await session.send('Page.printToPDF', {
      displayHeaderFooter: true,
      footerTemplate: `<div style="box-sizing: border-box; width: 100%; padding: 0 8mm; color: #5c574e; font-family: Arial, sans-serif; font-size: 6px; text-align: center;">Généré depuis mohsanaziz.github.io · v${version} — page <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
      headerTemplate: '<div></div>',
      preferCSSPageSize: true,
      printBackground: true,
    });

    await mkdir(dirname(PDF_PATH), { recursive: true });
    await writeFile(PDF_PATH, Buffer.from(data, 'base64'));

    return typographyTier;
  } finally {
    await Promise.allSettled([browser?.close(), buildServer.close()]);
  }
}

const typographyTier = await generatePdf();

console.log(`Generated ${PDF_PATH} with typography tier ${typographyTier.name} (×${typographyTier.scale})`);
