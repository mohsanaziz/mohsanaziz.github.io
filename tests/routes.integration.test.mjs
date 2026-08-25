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

test('le sélecteur relie les trois pages publiques avec des endonymes accessibles et reste absent des pages d’impression', async (t) => {
  const server = await startBuildServer(DIST_DIRECTORY);
  const browser = await chromium.launch();
  const page = await browser.newPage();

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  const expectedOptions = [
    { locale: 'fr', href: '/', endonym: 'Français', dir: 'ltr' },
    { locale: 'en', href: '/en/', endonym: 'English', dir: 'ltr' },
    { locale: 'ar', href: '/ar/', endonym: 'العربية', dir: 'rtl' },
  ];

  for (const locale of LOCALES) {
    await page.goto(`${server.origin}${localeUrlSegment(locale) ? `/${locale}/` : '/'}`);

    const selector = await page.locator('header details').evaluate((details) => {
      const endonymOf = (element) => element.querySelector('[lang][dir]');

      return {
        accessibleLabel: details.querySelector('summary .sr-only')?.textContent,
        summaryEndonym: endonymOf(details.querySelector('summary'))?.textContent?.trim(),
        title: details.querySelector(':scope > div > p')?.textContent?.trim(),
        options: Array.from(details.querySelectorAll('a[hreflang]'), (link) => {
          const endonym = endonymOf(link);

          return {
            href: link.getAttribute('href'),
            hreflang: link.getAttribute('hreflang'),
            linkLang: link.getAttribute('lang'),
            linkDir: link.getAttribute('dir'),
            endonym: endonym?.textContent?.trim(),
            endonymLang: endonym?.getAttribute('lang'),
            endonymDir: endonym?.getAttribute('dir'),
            current: link.getAttribute('aria-current'),
            badges: Array.from(link.querySelectorAll(':scope > .rounded-full'), (badge) => badge.textContent?.trim()),
          };
        }),
      };
    });

    const translate = useTranslations(locale);
    const messages = translate.messages.languageSelector;
    assert.equal(selector.accessibleLabel, `${translate.fieldLabel(messages.switchLanguage)} `);
    assert.equal(selector.summaryEndonym, expectedOptions.find((option) => option.locale === locale)?.endonym);
    assert.equal(selector.title, messages.switchLanguage);
    assert.deepEqual(
      selector.options.map(({ href, hreflang, linkLang, linkDir, endonym, endonymLang, endonymDir, current }) => ({
        href,
        hreflang,
        linkLang,
        linkDir,
        endonym,
        endonymLang,
        endonymDir,
        current,
      })),
      expectedOptions.map((option) => ({
        href: option.href,
        hreflang: option.locale,
        linkLang: null,
        linkDir: null,
        endonym: option.endonym,
        endonymLang: option.locale,
        endonymDir: option.dir,
        current: option.locale === locale ? 'page' : null,
      })),
    );
    assert.deepEqual(
      selector.options.map(({ badges }) => badges),
      [['default'], [], [messages.interfaceOnly]],
    );

    await page.locator('header summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('header details').getAttribute('open'), '');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('hreflang')), 'fr');

    await page.goto(`${server.origin}${localeUrlSegment(locale) ? `/${locale}/` : '/'}cv-print/`);
    assert.equal(await page.locator('header details').count(), 0);
  }
});

test('à 390 px le panneau reste dans le viewport côté end et seule la pastille Public revient à la ligne', async (t) => {
  const server = await startBuildServer(DIST_DIRECTORY);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  for (const { path, direction } of [
    { path: '/', direction: 'ltr' },
    { path: '/ar/', direction: 'rtl' },
  ]) {
    await page.goto(`${server.origin}${path}`);
    await page.locator('header summary').click();

    const geometry = await page.locator('header details').evaluate((details) => {
      const edges = (element) => {
        const { top, left, right, bottom } = element.getBoundingClientRect();

        return { top, left, right, bottom };
      };
      const summary = details.querySelector('summary');
      const panel = details.querySelector(':scope > div');
      const headerRow = details.parentElement?.parentElement;
      const repositoryLine = headerRow?.querySelector('p');
      const publicBadge = repositoryLine?.parentElement?.querySelector(':scope > span');

      if (!summary || !panel || !repositoryLine || !publicBadge) throw new Error('Unable to find the language selector geometry.');

      return {
        summary: edges(summary),
        panel: edges(panel),
        repositoryLine: edges(repositoryLine),
        publicBadge: edges(publicBadge),
      };
    });

    assert.ok(geometry.panel.left >= 0, `Expected ${path} panel left edge inside the viewport.`);
    assert.ok(geometry.panel.right <= 390, `Expected ${path} panel right edge inside the viewport.`);
    assert.ok(geometry.publicBadge.top >= geometry.repositoryLine.bottom, `Expected ${path} Public badge on the second line.`);
    assert.ok(geometry.summary.top < geometry.publicBadge.top, `Expected ${path} language button to stay on the first line.`);

    if (direction === 'ltr') {
      assert.ok(Math.abs(geometry.panel.right - geometry.summary.right) <= 1, 'Expected the LTR panel to be anchored on its right edge.');
    } else {
      assert.ok(Math.abs(geometry.panel.left - geometry.summary.left) <= 1, 'Expected the RTL panel to be anchored on its left edge.');
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
