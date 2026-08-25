import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { startBuildServer } from '../scripts/build-server.mjs';

const DIST_DIRECTORY = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const INDEX_PATH = resolve(DIST_DIRECTORY, 'index.html');
const FONT_DIRECTORY = resolve(DIST_DIRECTORY, 'fonts');
const EXPECTED_FONT_SIZES = {
  'NotoSansArabic-arabic.woff2': 166_152,
  'NotoSansArabic-latin.woff2': 31_368,
};

async function readBuiltFontDelivery() {
  const html = await readFile(INDEX_PATH, 'utf8');
  const stylesheetPaths = Array.from(html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g), ([, href]) => href);

  assert.ok(stylesheetPaths.length > 0, 'Expected the built page to load a stylesheet.');

  const stylesheets = await Promise.all(
    stylesheetPaths.map((stylesheetPath) => readFile(resolve(DIST_DIRECTORY, stylesheetPath.replace(/^\/+/, '')), 'utf8')),
  );

  return { html, css: stylesheets.join('\n') };
}

test('le build livre deux sous-ensembles et ne précharge que le latin', async () => {
  const { html, css } = await readBuiltFontDelivery();
  const fontFaces = css.match(/@font-face\{[^}]+\}/g) ?? [];
  const preloadedFonts = (html.match(/<link\b[^>]*>/g) ?? []).filter((link) => /\brel="preload"/.test(link) && /\bas="font"/.test(link));
  const builtFontEntries = await readdir(FONT_DIRECTORY, { withFileTypes: true });

  assert.equal(fontFaces.length, 2);
  assert.equal(preloadedFonts.length, 1);
  assert.match(preloadedFonts[0], /href="\/fonts\/NotoSansArabic-latin\.woff2"/);
  assert.doesNotMatch(preloadedFonts[0], /NotoSansArabic-arabic\.woff2/);
  assert.doesNotMatch(html, /Satoshi/i);
  assert.deepEqual(builtFontEntries.map(({ name }) => name).sort(), Object.keys(EXPECTED_FONT_SIZES));

  const builtFontSizes = Object.fromEntries(
    await Promise.all(builtFontEntries.map(async ({ name }) => [name, (await readFile(resolve(FONT_DIRECTORY, name))).byteLength])),
  );

  assert.deepEqual(builtFontSizes, EXPECTED_FONT_SIZES);

  const latinFace = fontFaces.find((fontFace) => fontFace.includes('NotoSansArabic-latin.woff2'));
  const arabicFace = fontFaces.find((fontFace) => fontFace.includes('NotoSansArabic-arabic.woff2'));

  assert.match(latinFace ?? '', /font-family:Noto Sans Arabic/);
  assert.match(latinFace ?? '', /font-weight:100 900/);
  assert.match(latinFace ?? '', /unicode-range:/);
  assert.match(arabicFace ?? '', /font-family:Noto Sans Arabic/);
  assert.match(arabicFace ?? '', /font-weight:100 900/);
  assert.match(arabicFace ?? '', /unicode-range:/);
  assert.match(arabicFace ?? '', /U\+FB50-FDFF/);
  assert.match(arabicFace ?? '', /U\+FE76-FEFC/);
});

test('la page française ne charge pas le sous-ensemble arabe et distingue les graisses 300 et 900', async (t) => {
  const server = await startBuildServer(DIST_DIRECTORY);
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

  const response = await page.goto(`${server.origin}/`, { waitUntil: 'networkidle' });

  assert.ok(response?.ok(), `Expected the built French page to load, received HTTP ${response?.status() ?? 'unknown'}.`);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));

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
      computedFamily: getComputedStyle(document.body).fontFamily,
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

test('le sous-ensemble arabe est chargé sur /ar/ et sur elle seule', async (t) => {
  const server = await startBuildServer(DIST_DIRECTORY);
  const browser = await chromium.launch();

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  for (const path of ['/', '/en/', '/ar/']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const fontRequests = [];

    page.on('request', (request) => {
      if (request.resourceType() === 'font') fontRequests.push(new URL(request.url()).pathname);
    });

    await page.goto(`${server.origin}${path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    assert.equal(
      fontRequests.includes('/fonts/NotoSansArabic-arabic.woff2'),
      path === '/ar/',
      `Expected Arabic font delivery only on /ar/, received ${JSON.stringify({ path, fontRequests })}.`,
    );

    await context.close();
  }
});
