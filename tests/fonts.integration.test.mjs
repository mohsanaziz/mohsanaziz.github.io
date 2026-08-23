import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const DIST_DIRECTORY = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const INDEX_PATH = resolve(DIST_DIRECTORY, 'index.html');
const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.woff2', 'font/woff2'],
]);

async function readBuiltFontDelivery() {
  const html = await readFile(INDEX_PATH, 'utf8');
  const stylesheetPaths = Array.from(html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g), ([, href]) => href);

  assert.ok(stylesheetPaths.length > 0, 'Expected the built page to load a stylesheet.');

  const stylesheets = await Promise.all(
    stylesheetPaths.map((stylesheetPath) => readFile(resolve(DIST_DIRECTORY, stylesheetPath.replace(/^\/+/, '')), 'utf8')),
  );

  return { html, stylesheetPaths, css: stylesheets.join('\n') };
}

function resolveBuildPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl ?? '/', 'http://localhost').pathname);
  const absolutePath = resolve(DIST_DIRECTORY, pathname.replace(/^\/+/, ''));

  if (absolutePath !== DIST_DIRECTORY && !absolutePath.startsWith(`${DIST_DIRECTORY}${sep}`)) {
    throw new Error(`Path outside the build directory: ${pathname}`);
  }

  return absolutePath;
}

function startFontFixtureServer(stylesheetPaths) {
  const server = createServer(async (request, response) => {
    try {
      if (request.url === '/font-fixture') {
        const stylesheets = stylesheetPaths.map((href) => `<link rel="stylesheet" href="${href}">`).join('');
        const fixture = `<!doctype html><html><head>${stylesheets}</head><body><p class="font-sans">Hamburgefontsiv français</p></body></html>`;

        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end(fixture);
        return;
      }

      const filePath = resolveBuildPath(request.url);
      const fileStats = await stat(filePath);
      const contents = await readFile(filePath);

      response.writeHead(200, {
        'content-length': fileStats.size,
        'content-type': CONTENT_TYPES.get(extname(filePath)) ?? 'application/octet-stream',
      });
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
        reject(new Error('Unable to determine the font fixture server address.'));
        return;
      }

      resolveServer({
        origin: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((resolveClose, rejectClose) => server.close((error) => (error ? rejectClose(error) : resolveClose()))),
      });
    });
  });
}

test('le build livre deux sous-ensembles et ne précharge que le latin', async () => {
  const { html, css } = await readBuiltFontDelivery();
  const fontFaces = css.match(/@font-face\{[^}]+\}/g) ?? [];

  assert.equal(fontFaces.length, 2);
  assert.match(html, /<link rel="preload" href="\/fonts\/NotoSansArabic-latin\.woff2" as="font" type="font\/woff2" crossorigin>/);
  assert.doesNotMatch(html, /NotoSansArabic-arabic\.woff2[^>]*rel="preload"/);
  assert.doesNotMatch(html, /Satoshi/i);

  const latinFace = fontFaces.find((fontFace) => fontFace.includes('NotoSansArabic-latin.woff2'));
  const arabicFace = fontFaces.find((fontFace) => fontFace.includes('NotoSansArabic-arabic.woff2'));

  assert.match(latinFace ?? '', /font-family:Noto Sans Arabic/);
  assert.match(latinFace ?? '', /font-weight:100 900/);
  assert.match(latinFace ?? '', /unicode-range:U\+\?\?/);
  assert.match(arabicFace ?? '', /font-family:Noto Sans Arabic/);
  assert.match(arabicFace ?? '', /font-weight:100 900/);
  assert.match(arabicFace ?? '', /unicode-range:U\+6\?\?/);
  assert.match(arabicFace ?? '', /U\+FB50-FDFF/);
  assert.match(arabicFace ?? '', /U\+FE76-FEFC/);
});

test('une page latine ne charge pas le sous-ensemble arabe et distingue les graisses 300 et 900', async (t) => {
  const { stylesheetPaths } = await readBuiltFontDelivery();
  const server = await startFontFixtureServer(stylesheetPaths);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const requests = [];
  const responses = [];

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  page.on('request', (request) => {
    requests.push({ path: new URL(request.url()).pathname, type: request.resourceType() });
  });
  page.on('response', (response) => {
    responses.push({ path: new URL(response.url()).pathname, status: response.status() });
  });

  await page.goto(`${server.origin}/font-fixture`);

  const fontDiagnostics = await page.evaluate(async () => {
    const sample = 'Hamburgefontsiv';
    const fontFamily = 'Noto Sans Arabic';

    const loadedFaces = await Promise.all([
      document.fonts.load(`300 96px "${fontFamily}"`, sample),
      document.fonts.load(`900 96px "${fontFamily}"`, sample),
    ]);

    const countInkPixels = (weight) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 150;
      const context = canvas.getContext('2d');

      if (!context) throw new Error('Unable to create a 2D canvas context.');

      context.font = `${weight} 96px "${fontFamily}"`;
      context.textBaseline = 'top';
      context.fillText(sample, 0, 0);

      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0;

      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] > 0) count += 1;
      }

      return count;
    };

    return {
      light: countInkPixels(300),
      black: countInkPixels(900),
      loaded: document.fonts.check(`300 96px "${fontFamily}"`, sample) && document.fonts.check(`900 96px "${fontFamily}"`, sample),
      loadedFaceCounts: loadedFaces.map((faces) => faces.length),
      fontFaces: Array.from(document.fonts, ({ family, status, weight }) => ({ family, status, weight })),
      computedFamily: getComputedStyle(document.querySelector('p')).fontFamily,
      styleSheets: Array.from(document.styleSheets, (styleSheet) => ({ href: styleSheet.href, ruleCount: styleSheet.cssRules.length })),
    };
  });

  assert.ok(fontDiagnostics.loaded, 'Expected both requested weights to load from Noto Sans Arabic.');
  assert.deepEqual(fontDiagnostics.loadedFaceCounts, [1, 1]);
  assert.match(fontDiagnostics.computedFamily, /Noto Sans Arabic/);
  assert.ok(
    fontDiagnostics.black > fontDiagnostics.light * 1.2,
    `Expected weight 900 (${fontDiagnostics.black} pixels) to be visibly heavier than 300 (${fontDiagnostics.light} pixels).`,
  );
  assert.ok(
    requests.some(({ path }) => path === '/fonts/NotoSansArabic-latin.woff2'),
    `Expected the Latin font request, received ${JSON.stringify({ requests, responses, fontDiagnostics })}.`,
  );
  assert.ok(!requests.some(({ path }) => path === '/fonts/NotoSansArabic-arabic.woff2'));
});
