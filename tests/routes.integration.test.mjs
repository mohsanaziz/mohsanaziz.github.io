import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { startBuildServer } from '../scripts/build-server.mjs';
import { GITHUB_LEXICON } from '../src/components/lexicon.ts';
import * as en from '../src/i18n/en.ts';
import * as fr from '../src/i18n/fr.ts';
import { LOCALES } from '../src/i18n/locales.ts';
import { localeDirection, localeUrlSegment, resumePath } from '../src/i18n/routing.ts';
import { useTranslations } from '../src/i18n/translate.ts';
import { flattenStrings } from './layer-strings.mjs';

const DIST_DIRECTORY = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));

function builtPagePath(locale, route = '') {
  return resolve(DIST_DIRECTORY, ...[localeUrlSegment(locale), route, 'index.html'].filter(Boolean));
}

async function readBuiltPage(locale, route) {
  return readFile(builtPagePath(locale, route), 'utf8');
}

// Astro escapes a handful of characters in the rendered HTML; compare against the source strings.
function decodeHtml(html) {
  return html.replaceAll('&#39;', "'").replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
}

function htmlAttributes(html) {
  const [, attributes] = html.match(/<html\b([^>]*)>/) ?? [];

  assert.ok(attributes !== undefined, 'Expected the built page to open with an <html> tag.');

  return Object.fromEntries(Array.from(attributes.matchAll(/([\w-]+)="([^"]*)"/g), ([, name, value]) => [name, value]));
}

test('le build sert /, /en/ et /ar/ ainsi que leurs routes d’impression, sans /fr/', async () => {
  for (const locale of LOCALES) {
    await access(builtPagePath(locale));
    await access(builtPagePath(locale, 'cv-print'));
  }

  await assert.rejects(access(resolve(DIST_DIRECTORY, 'fr')), { code: 'ENOENT' });
});

test('chaque page porte le lang de sa locale et dir="rtl" sur l’arabe seulement', async () => {
  for (const locale of LOCALES) {
    for (const route of ['', 'cv-print']) {
      const { lang, dir } = htmlAttributes(await readBuiltPage(locale, route));

      assert.equal(lang, locale, `Expected /${localeUrlSegment(locale) ?? ''} ${route} to declare lang="${locale}".`);
      assert.equal(dir, localeDirection(locale) === 'rtl' ? 'rtl' : undefined);
    }
  }
});

test('les routes d’impression restent noindex, nofollow et les pages publiques indexables', async () => {
  for (const locale of LOCALES) {
    assert.match(await readBuiltPage(locale, 'cv-print'), /<meta name="robots" content="noindex, nofollow">/);
    assert.doesNotMatch(await readBuiltPage(locale), /<meta name="robots"/);
  }
});

test('chaque page publique télécharge le PDF depuis resumePath(locale)', async () => {
  for (const locale of LOCALES) {
    const html = await readBuiltPage(locale);

    assert.ok(html.includes(`href="${resumePath(locale)}"`), `Expected the ${locale} page to link ${resumePath(locale)}.`);
  }
});

test('aucune page ne livre de JavaScript ni de redirection meta refresh', async () => {
  for (const locale of LOCALES) {
    for (const route of ['', 'cv-print']) {
      const html = await readBuiltPage(locale, route);

      assert.doesNotMatch(html, /<script\b/);
      assert.doesNotMatch(html, /http-equiv="refresh"/i);
    }
  }
});

test('sur /ar/ la colonne latérale passe à gauche et les compteurs et valeurs de fait rejoignent le bord opposé', async (t) => {
  const server = await startBuildServer(DIST_DIRECTORY);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  async function measure(path) {
    const response = await page.goto(`${server.origin}${path}`, { waitUntil: 'networkidle' });

    assert.ok(response?.ok(), `Expected ${path} to load, received HTTP ${response?.status() ?? 'unknown'}.`);

    return page.evaluate(() => {
      const edges = (element) => {
        const { left, right } = element.getBoundingClientRect();

        return { left, right };
      };
      const frame = document.querySelector('main section[aria-label="Expérience professionnelle"]');
      const counter = frame?.querySelector(':scope > div:first-child > span:last-child');
      const aside = document.querySelector('aside');
      const factValue = document.querySelector('dd');

      if (!frame || !counter || !aside || !factValue) throw new Error('Unable to find the measured page elements.');

      return {
        aside: edges(aside),
        frame: edges(frame),
        counter: edges(counter),
        factValueAlign: getComputedStyle(factValue).textAlign,
      };
    });
  }

  const ltr = await measure('/');
  const rtl = await measure('/ar/');

  assert.ok(ltr.aside.left > ltr.frame.right, 'Expected the French sidebar on the right of the main column.');
  assert.ok(rtl.aside.right < rtl.frame.left, 'Expected the Arabic sidebar on the left of the main column.');
  assert.ok(ltr.frame.right - ltr.counter.right < 32, 'Expected the French section counter against the frame end edge.');
  assert.ok(rtl.counter.left - rtl.frame.left < 32, 'Expected the Arabic section counter against the frame start edge.');
  assert.equal(ltr.factValueAlign, 'end');
  assert.equal(rtl.factValueAlign, 'end');
});

test('/en/ ne laisse subsister aucune chaîne française là où l’anglais diffère', async () => {
  const html = decodeHtml(await readBuiltPage('en'));
  const englishStrings = new Map(flattenStrings({ ...en.messages, ...en.cv }));

  for (const [path, frenchValue] of flattenStrings({ ...fr.messages, ...fr.cv })) {
    if (englishStrings.get(path) === frenchValue) continue;

    assert.ok(!html.includes(frenchValue), `Expected the English page to drop the French “${path}”: “${frenchValue}”.`);
  }
});

test('/en/ rend son contenu et son interface en anglais', async () => {
  const html = decodeHtml(await readBuiltPage('en'));
  const english = useTranslations('en');
  const expected = [
    en.cv.profile.jobTitle,
    en.cv.about.title,
    en.cv.professionalExperience.title,
    en.cv.institutions.frenchMinistryOfJustice,
    en.messages.navigation.additionalInformation,
    en.messages.labels.contract,
    english.count('employer', 2),
    english.count('version', 6),
  ];

  for (const value of expected) {
    assert.ok(html.includes(value), `Expected the English page to render “${value}”.`);
  }

  assert.match(html, /<title>CV — Mohsan AZIZ<\/title>/);
});

test('le lexique GitHub reste en anglais sur / comme sur /en/', async () => {
  for (const locale of ['fr', 'en']) {
    const html = decodeHtml(await readBuiltPage(locale));

    for (const term of Object.values(GITHUB_LEXICON)) {
      assert.ok(html.includes(term), `Expected the ${locale} page to quote the GitHub term “${term}”.`);
    }
  }

  const frenchHtml = decodeHtml(await readBuiltPage('fr'));

  for (const translated of ['Langages', 'Contributeurs', 'En résumé']) {
    assert.ok(!frenchHtml.includes(translated), `Expected the GitHub lexicon to stay in English, found “${translated}”.`);
  }
});
