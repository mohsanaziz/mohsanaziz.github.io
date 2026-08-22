// PROTOTYPE — jetable. Issue #82.
// Capture les 32 cartes nues (4 compositions × 4 locales × 2 thèmes) exactement comme le
// ferait la génération au build arbitrée en #81 : viewport 1200×630, Chromium, artefact PNG.
// Capture aussi les 16 écrans de contrôle, pour juger les vignettes hors du navigateur.
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const outputDirectory = new URL('../tmp/prototype-og/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });

const VARIANTS = ['A', 'B', 'C', 'D'];
const LANGS = ['fr', 'en', 'ar', 'ar-sans'];
const THEMES = ['light', 'dark'];

const browser = await chromium.launch();
const card = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const harness = await browser.newPage({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1 });

const settle = async (page) => {
  // La barre d'outils de dev d'Astro flotte en bas de page : elle n'a rien à faire sur un
  // artefact qui prétend montrer ce que Chromium capturera au build.
  await page.addStyleTag({
    content: 'astro-dev-toolbar, [data-prototype-switcher] { display: none !important; }',
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
};

for (const variant of VARIANTS) {
  for (const lang of LANGS) {
    for (const theme of THEMES) {
      await card.goto(`http://localhost:4321/prototype-og/card/${variant}/${lang}/${theme}/`, { waitUntil: 'networkidle' });
      await settle(card);
      await card.screenshot({ path: new URL(`card-${variant}-${lang}-${theme}.png`, outputDirectory).pathname });
    }

    await harness.goto(`http://localhost:4321/prototype-og/${variant}/${lang}/`, { waitUntil: 'networkidle' });
    await settle(harness);
    await harness.screenshot({ path: new URL(`harness-${variant}-${lang}.png`, outputDirectory).pathname, fullPage: true });

    console.log(`${variant}/${lang}`);
  }
}

await browser.close();
