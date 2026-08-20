import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST_DIRECTORY = resolve(PROJECT_ROOT, 'dist');
const PDF_PATH = resolve(DIST_DIRECTORY, 'cv/CV.pdf');
const PACKAGE_PATH = resolve(PROJECT_ROOT, 'package.json');

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

      response.writeHead(200, {
        'content-length': fileStats.size,
        'content-type': CONTENT_TYPES.get(extname(filePath)) ?? 'application/octet-stream',
      });

      if (request.method === 'HEAD') {
        response.end();
        return;
      }

      response.end(await readFile(filePath));
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

async function generatePdf() {
  const { version } = JSON.parse(await readFile(PACKAGE_PATH, 'utf8'));
  const buildServer = await startBuildServer();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    const failedRequests = [];

    page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));

    const response = await page.goto(`${buildServer.origin}/cv-print`, { waitUntil: 'networkidle' });

    if (!response?.ok()) {
      throw new Error(`The printable CV returned HTTP ${response?.status() ?? 'unknown'}.`);
    }

    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    if (failedRequests.length > 0) {
      throw new Error(`The printable CV did not load completely:\n${failedRequests.join('\n')}`);
    }

    await page.emulateMedia({ media: 'print' });

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
  } finally {
    await Promise.allSettled([browser?.close(), buildServer.close()]);
  }
}

await generatePdf();

console.log(`Generated ${PDF_PATH}`);
