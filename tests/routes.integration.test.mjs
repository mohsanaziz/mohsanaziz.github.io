import assert from 'node:assert/strict';
import { access, glob, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { startBuildServer } from '../scripts/build-server.mjs';
import { GITHUB_LEXICON } from '../src/components/lexicon.ts';
import * as ar from '../src/i18n/ar.ts';
import * as en from '../src/i18n/en.ts';
import * as fr from '../src/i18n/fr.ts';
import { DEFAULT_LOCALE, localeFormatting, LOCALES } from '../src/i18n/locales.ts';
import { LANGUAGE_CHOICE_PARAMETER, languageChoiceHref } from '../src/i18n/negotiation.ts';
import { localeDirection, localeHomePath, localePagePath, localeUrlSegment, resumeFileName, resumePath } from '../src/i18n/routing.ts';
import { useTranslations } from '../src/i18n/translate.ts';
import { flattenStrings } from './layer-strings.mjs';

const DIST_DIRECTORY = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
// Les contextes partagés qui visitent la seule route négociable (`/`) annoncent sa locale par défaut.
// Les routes localisées restent déterministes quelle que soit la langue du navigateur.
const ROOT_CONTEXT_LOCALE = DEFAULT_LOCALE;

// Les tests de négociation partagent ce montage : le dist réel servi, piloté par un vrai navigateur, fermé avec le test.
async function startBrowserFixture(t) {
  const server = await startBuildServer(DIST_DIRECTORY);
  const browser = await chromium.launch();

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  return { server, browser };
}

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

test('le build sert /, /en/ et /ar/ ainsi que leurs routes techniques, sans /fr/', async () => {
  for (const locale of LOCALES) {
    await access(builtPagePath(locale));
    await access(builtPagePath(locale, 'cv-print'));
    await access(builtPagePath(locale, 'og-card'));
    await access(resolve(DIST_DIRECTORY, resumePath(locale).slice(1)));
  }

  await assert.rejects(access(resolve(DIST_DIRECTORY, 'fr')), { code: 'ENOENT' });
});

test('chaque page porte le lang de sa locale et dir="rtl" sur l’arabe seulement', async () => {
  for (const locale of LOCALES) {
    for (const route of ['', 'cv-print', 'og-card']) {
      const { lang, dir } = htmlAttributes(await readBuiltPage(locale, route));

      assert.equal(lang, locale, `Expected /${localeUrlSegment(locale) ?? ''} ${route} to declare lang="${locale}".`);
      assert.equal(dir, localeDirection(locale) === 'rtl' ? 'rtl' : undefined);
    }
  }
});

test('chaque page publique affiche et télécharge le PDF de sa locale', async () => {
  for (const locale of LOCALES) {
    const html = await readBuiltPage(locale);
    const fileName = resumeFileName(locale);

    assert.ok(html.includes(`href="${resumePath(locale)}"`), `Expected the ${locale} page to link ${resumePath(locale)}.`);
    assert.ok(html.includes(`download="${fileName}"`), `Expected the ${locale} page to download ${fileName}.`);
    assert.match(html, new RegExp(`<span class="truncate">${fileName.replace('.', '\\.')}</span>`));
  }
});

test('seule la racine livre un script, inline, et aucune page ne livre de redirection meta refresh', async () => {
  // L’invariant porte sur tout ce que le build publie : les neuf pages localisées et techniques, et la 404.
  const publishedPages = [
    ...LOCALES.flatMap((locale) =>
      ['', 'cv-print', 'og-card'].map((route) => ({
        path: localePagePath(locale, route),
        isRoot: locale === DEFAULT_LOCALE && route === '',
        read: () => readBuiltPage(locale, route),
      })),
    ),
    { path: '/404.html', isRoot: false, read: () => readFile(resolve(DIST_DIRECTORY, '404.html'), 'utf8') },
  ];

  assert.equal(publishedPages.length, 10, 'Expected the invariant to cover every published page.');

  for (const { path, isRoot, read } of publishedPages) {
    const html = await read();
    const scripts = Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g));

    assert.doesNotMatch(html, /http-equiv="refresh"/i, `Expected ${path} to redirect through no meta refresh.`);
    assert.equal(scripts.length, isRoot ? 1 : 0, `Expected ${path} to ship ${isRoot ? 'one' : 'no'} script.`);

    if (!isRoot) continue;

    const [, attributes, code] = scripts[0];

    assert.doesNotMatch(attributes, /\b(src|type|defer|async)\b/, 'Expected the negotiation script to be inline and synchronous.');
    assert.doesNotMatch(code, /[\r\n]/, 'Expected the negotiation script to be minified at build time.');
    assert.doesNotMatch(code, /cookie|localStorage|sessionStorage/, 'Expected the negotiation to keep the URL as its only memory.');
    assert.ok(code.includes(`"${LANGUAGE_CHOICE_PARAMETER}"`), 'Expected the negotiation script to read the shared choice marker.');

    // The map is derived from the locale list, so a fourth locale would land here without touching the script.
    for (const servedLocale of LOCALES) {
      assert.ok(code.includes(`"${localeHomePath(servedLocale)}"`), `Expected the negotiation map to serve ${servedLocale}.`);
    }
  }
});

test('chaque document HTML et feuille de style du build tient sur une seule ligne', async () => {
  const builtAssetPaths = await Array.fromAsync(glob(['**/*.html', '**/*.css'], { cwd: DIST_DIRECTORY }));

  assert.ok(
    builtAssetPaths.some((assetPath) => assetPath.endsWith('.html')),
    'Expected the build to contain HTML documents.',
  );
  assert.ok(
    builtAssetPaths.some((assetPath) => assetPath.endsWith('.css')),
    'Expected the build to contain stylesheets.',
  );

  for (const assetPath of builtAssetPaths) {
    const lines = (await readFile(resolve(DIST_DIRECTORY, assetPath), 'utf8')).split(/\r\n|\r|\n/);

    if (lines.at(-1) === '') lines.pop();

    assert.equal(lines.length, 1, `Expected ${assetPath} to fit on one line, received ${lines.length}.`);
  }
});

test('la racine conduit chaque navigateur vers sa langue, requête et fragment compris, sans empiler d’historique', async (t) => {
  const { server, browser } = await startBrowserFixture(t);

  // Les tags régionaux sont reconnus par leur seul sous-tag primaire ; une langue non servie laisse la racine en place.
  for (const { browserLocale, locale } of [
    { browserLocale: 'en-GB', locale: 'en' },
    { browserLocale: 'ar-DZ', locale: 'ar' },
    { browserLocale: 'fr-CA', locale: 'fr' },
    { browserLocale: 'de-DE', locale: 'fr' },
  ]) {
    const context = await browser.newContext({ locale: browserLocale });
    const page = await context.newPage();

    await page.goto(`${server.origin}/`);

    const landed = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      cookie: document.cookie,
      storedEntries: localStorage.length + sessionStorage.length,
    }));

    assert.equal(new URL(page.url()).pathname, localeHomePath(locale), `Expected ${browserLocale} to land on the ${locale} page.`);
    assert.equal(landed.lang, locale, `Expected ${browserLocale} to be served the ${locale} document.`);
    assert.equal(landed.cookie, '', 'Expected the negotiation to write no cookie.');
    assert.equal(landed.storedEntries, 0, 'Expected the negotiation to write no local or session storage.');

    await context.close();
  }

  // L’ordre du navigateur tranche : l’allemand n’est pas servi, l’arabe précède l’anglais.
  const orderedContext = await browser.newContext({ locale: 'de-DE' });

  await orderedContext.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', { get: () => ['de-DE', 'ar-DZ', 'en-GB'] });
  });

  const orderedPage = await orderedContext.newPage();

  await orderedPage.goto(`${server.origin}/`);
  assert.equal(new URL(orderedPage.url()).pathname, '/ar/', 'Expected the first served language of the browser list to win.');
  await orderedContext.close();

  const context = await browser.newContext({ locale: 'en-GB' });
  const page = await context.newPage();

  await page.goto(`${server.origin}/?utm_source=cv&page=2#profil`);
  assert.equal(page.url(), `${server.origin}/en/?utm_source=cv&page=2#profil`, 'Expected the query string and the fragment to follow.');

  // Le saut remplace l’entrée courante : le retour arrière quitte la racine au lieu de la rejouer.
  await page.goto(`${server.origin}/ar/`);
  await page.goto(`${server.origin}/`);
  assert.equal(new URL(page.url()).pathname, '/en/');
  await page.goBack();
  assert.equal(new URL(page.url()).pathname, '/ar/', 'Expected the back navigation to skip the replaced root entry.');
});

test('le marqueur de choix neutralise la négociation, au chargement comme au rechargement, et n’est porté que par le lien français', async (t) => {
  const { server, browser } = await startBrowserFixture(t);
  const context = await browser.newContext({ locale: 'en-GB' });
  const page = await context.newPage();

  const markedRoot = `/?${LANGUAGE_CHOICE_PARAMETER}=${DEFAULT_LOCALE}`;

  await page.goto(`${server.origin}${markedRoot}`);
  assert.equal(new URL(page.url()).pathname, '/', 'Expected the marker to keep an English browser on the French root.');
  assert.equal(await page.evaluate(() => document.documentElement.lang), DEFAULT_LOCALE);

  // Le marqueur n’est pas nettoyé après lecture : sans lui dans la barre d’adresse, un rechargement déferait le choix.
  await page.reload();
  assert.equal(page.url(), `${server.origin}${markedRoot}`, 'Expected the marker to survive a reload.');
  assert.equal(await page.evaluate(() => document.documentElement.lang), DEFAULT_LOCALE);

  // Seule la présence de la clé compte ; sa valeur n’est jamais interprétée.
  await page.goto(`${server.origin}/?${LANGUAGE_CHOICE_PARAMETER}=en`);
  assert.equal(new URL(page.url()).pathname, '/', 'Expected the marker value to be left uninterpreted.');

  // Les liens vers l’anglais et l’arabe restent nus : ces pages ne négocient rien.
  const expectedHomeHrefs = LOCALES.map((locale) => languageChoiceHref(locale, localeHomePath(locale)));

  assert.deepEqual(expectedHomeHrefs, [markedRoot, '/en/', '/ar/']);

  const homeHrefs = (selector) => page.locator(selector).evaluateAll((links) => links.map((link) => link.getAttribute('href')));

  await page.goto(`${server.origin}/404.html`);
  assert.deepEqual(await homeHrefs('main a[hreflang]'), expectedHomeHrefs, 'Expected the 404 home links to mark French only.');

  // Un anglophone qui choisit délibérément le français obtient le français, et le garde.
  await page.locator('main a[hreflang="fr"]').click();
  assert.equal(page.url(), `${server.origin}${markedRoot}`);
  assert.equal(await page.evaluate(() => document.documentElement.lang), DEFAULT_LOCALE);

  for (const locale of LOCALES) {
    await page.goto(`${server.origin}${languageChoiceHref(locale, localeHomePath(locale))}`);
    assert.deepEqual(
      await homeHrefs('header details a[hreflang]'),
      expectedHomeHrefs,
      `Expected the ${locale} selector to mark French only.`,
    );
  }
});

test('aucune page hors de la racine ne négocie, même pour un navigateur anglophone', async (t) => {
  const { server, browser } = await startBrowserFixture(t);
  const page = await browser.newPage({ locale: 'en-GB' });

  const paths = [
    ...LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => localeHomePath(locale)),
    ...LOCALES.flatMap((locale) => ['cv-print', 'og-card'].map((route) => `${localePagePath(locale, route)}/`)),
    '/404.html',
  ];

  for (const path of paths) {
    await page.goto(`${server.origin}${path}`);
    assert.equal(new URL(page.url()).pathname, path, `Expected ${path} to stay put for an English browser.`);
  }
});

test('sans JavaScript la racine rend le français complet et son sélecteur reste utilisable', async (t) => {
  const { server, browser } = await startBrowserFixture(t);
  const context = await browser.newContext({ locale: 'en-GB', javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto(`${server.origin}/`);
  assert.equal(new URL(page.url()).pathname, '/', 'Expected the redirection to remain a shortcut, never a dependency.');
  assert.equal(await page.locator('html').getAttribute('lang'), DEFAULT_LOCALE);
  assert.ok((await page.locator('main').textContent())?.includes(fr.cv.about.paragraphs[0]), 'Expected the full French page.');

  await page.locator('header summary').click();
  await page.locator('header details a[hreflang="en"]').click();
  assert.equal(new URL(page.url()).pathname, '/en/', 'Expected the native language selector to work without JavaScript.');
});

test('les cartes Open Graph rendent le calque de leur locale, dont l’arabe en RTL avec sa police embarquée', async (t) => {
  const server = await startBuildServer(DIST_DIRECTORY);
  const browser = await chromium.launch();

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  const expected = {
    fr: { name: 'Mohsan AZIZ', jobTitle: 'Développeur freelance Angular/Java', location: 'Paris, France' },
    en: { name: 'Mohsan AZIZ', jobTitle: 'Freelance Angular/Java Developer', location: 'Paris, France' },
    ar: { name: 'محسن عزيز', jobTitle: 'مطوّر Angular/Java مستقل', location: 'باريس، فرنسا' },
  };

  for (const locale of LOCALES) {
    const context = await browser.newContext({ locale, viewport: { width: 1200, height: 630 } });
    const page = await context.newPage();
    const fontRequests = [];

    page.on('request', (request) => {
      if (request.resourceType() === 'font') fontRequests.push(new URL(request.url()).pathname);
    });

    await page.goto(`${server.origin}${localePagePath(locale, 'og-card')}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    const card = await page.locator('main').evaluate((main) => {
      const { width, height } = main.getBoundingClientRect();
      const firstFontFamily = (element) =>
        getComputedStyle(element)
          .fontFamily.split(',')[0]
          .trim()
          .replace(/^['"]|['"]$/g, '');
      const loadedFont = (family) =>
        Array.from(document.fonts).some(
          (fontFace) => fontFace.family.trim().replace(/^['"]|['"]$/g, '') === family && fontFace.status === 'loaded',
        );
      const arabicFamilies = [];
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      let textNode;

      while ((textNode = walker.nextNode())) {
        if (textNode.textContent?.match(/\p{Script=Arabic}/u) && textNode.parentElement) {
          arabicFamilies.push(firstFontFamily(textNode.parentElement));
        }
      }

      const monoFamilies = Array.from(main.querySelectorAll('[data-og-card-mono]'), firstFontFamily);
      const name = main.querySelector('[data-og-card-name]');
      const image = main.querySelector('img');

      if (!(name instanceof HTMLElement) || !(image instanceof HTMLImageElement)) {
        throw new Error('Unable to find the Open Graph card name and portrait.');
      }

      const nameStyle = getComputedStyle(name);
      const nameLineCount = Math.round(name.getBoundingClientRect().height / Number.parseFloat(nameStyle.lineHeight));

      return {
        width,
        height,
        colorScheme: getComputedStyle(main).colorScheme,
        text: main.textContent,
        direction: document.documentElement.dir || 'ltr',
        fallbackLanguage: main.querySelector('p[lang]')?.getAttribute('lang') ?? null,
        nameLineCount,
        arabicFont: { families: [...new Set(arabicFamilies)], loaded: loadedFont('Noto Sans Arabic') },
        monoFont: { families: [...new Set(monoFamilies)], loaded: loadedFont('Noto Sans Mono') },
        image: { complete: image.complete, loading: image.loading, naturalWidth: image.naturalWidth },
      };
    });

    assert.equal(card.width, 1200);
    assert.equal(card.height, 630);
    assert.equal(card.colorScheme, 'light');
    assert.equal(card.direction, localeDirection(locale));
    assert.match(card.text, new RegExp(expected[locale].name));
    assert.match(card.text, new RegExp(expected[locale].jobTitle));
    assert.match(card.text, new RegExp(expected[locale].location));
    assert.equal(card.fallbackLanguage, null);
    assert.equal(card.nameLineCount, 1);
    assert.equal(fontRequests.includes('/fonts/NotoSansArabic-arabic.woff2'), locale === 'ar');
    assert.deepEqual(card.arabicFont.families, locale === 'ar' ? ['Noto Sans Arabic'] : []);
    assert.equal(card.arabicFont.loaded, locale === 'ar');
    assert.equal(fontRequests.includes('/fonts/NotoSansMono-latin.woff2'), true);
    assert.deepEqual(card.monoFont.families, ['Noto Sans Mono']);
    assert.equal(card.monoFont.loaded, true);
    assert.deepEqual(card.image, { complete: true, loading: 'eager', naturalWidth: 76 });

    await context.close();
  }
});

test('le média d’impression charge la face arabe sur /ar/ seulement et l’applique à chaque texte arabe', async (t) => {
  const server = await startBuildServer(DIST_DIRECTORY);
  const browser = await chromium.launch();

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  for (const locale of LOCALES) {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    const fontRequests = [];

    page.on('request', (request) => {
      if (request.resourceType() === 'font') fontRequests.push(new URL(request.url()).pathname);
    });

    await page.emulateMedia({ media: 'print' });
    await page.goto(`${server.origin}${locale === 'fr' ? '/' : `/${locale}/`}cv-print/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    assert.equal(
      fontRequests.includes('/fonts/NotoSansArabic-arabic.woff2'),
      locale === 'ar',
      `Expected the Arabic print face on ${locale} only, received ${JSON.stringify(fontRequests)}.`,
    );

    if (locale === 'ar') {
      const font = await page.evaluate(() => {
        const roots = document.querySelectorAll('.print-document, .print-footer-copy');
        const family = 'Noto Sans Arabic';
        const targets = [];

        for (const root of roots) {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          let textNode;

          while ((textNode = walker.nextNode())) {
            if (!textNode.textContent?.match(/\p{Script=Arabic}/u) || !textNode.parentElement) continue;

            const firstFamily = getComputedStyle(textNode.parentElement)
              .fontFamily.split(',')[0]
              .trim()
              .replace(/^['"]|['"]$/g, '');
            targets.push(firstFamily);
          }
        }

        return {
          targetCount: targets.length,
          families: [...new Set(targets)],
          footerDisplay: getComputedStyle(document.querySelector('.print-footer-copy')).display,
          loaded: Array.from(document.fonts).some(
            (fontFace) => fontFace.family.trim().replace(/^['"]|['"]$/g, '') === family && fontFace.status === 'loaded',
          ),
        };
      });

      assert.ok(font.targetCount > 0);
      assert.deepEqual(font.families, ['Noto Sans Arabic']);
      assert.equal(font.footerDisplay, 'block');
      assert.equal(font.loaded, true);
    }

    await context.close();
  }
});

test('les hauteurs de ligne d’impression restent compactes en latin et sûres en arabe', async (t) => {
  const server = await startBuildServer(DIST_DIRECTORY);
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: DEFAULT_LOCALE });

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  const expected = {
    fr: { document: localeFormatting('fr').lineHeight, heading: 1.05, badge: 1.2 },
    en: { document: localeFormatting('en').lineHeight, heading: 1.05, badge: 1.2 },
    ar: {
      document: localeFormatting('ar').lineHeight,
      heading: localeFormatting('ar').lineHeight,
      badge: localeFormatting('ar').lineHeight,
    },
  };

  for (const locale of LOCALES) {
    await page.emulateMedia({ media: 'print' });
    await page.goto(`${server.origin}${locale === 'fr' ? '/' : `/${locale}/`}cv-print/`, { waitUntil: 'networkidle' });

    const ratios = await page.evaluate(() => {
      const ratio = (element) => {
        const style = getComputedStyle(element);
        return Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize);
      };
      const document = globalThis.document.querySelector('.print-document');
      const heading = globalThis.document.querySelector('.readme-content h1');
      const badge = globalThis.document.querySelector('.badge');

      if (!document || !heading || !badge) throw new Error('Unable to find the print typography targets.');

      return { document: ratio(document), heading: ratio(heading), badge: ratio(badge) };
    });

    for (const key of ['document', 'heading', 'badge']) {
      assert.ok(
        Math.abs(ratios[key] - expected[locale][key]) < 0.001,
        `Expected ${locale} ${key} ratio ${expected[locale][key]}, got ${ratios[key]}.`,
      );
    }
  }
});

test('le sélecteur relie les trois pages publiques avec des endonymes accessibles et reste absent des pages d’impression', async (t) => {
  const server = await startBuildServer(DIST_DIRECTORY);
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: ROOT_CONTEXT_LOCALE });

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  const expectedOptions = [
    { locale: 'fr', href: '/?lang=fr', endonym: 'Français' },
    { locale: 'en', href: '/en/', endonym: 'English' },
    { locale: 'ar', href: '/ar/', endonym: 'العربية' },
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
        endonymDir: 'auto',
        current: option.locale === locale ? 'page' : null,
      })),
    );
    assert.deepEqual(
      selector.options.map(({ badges }) => badges),
      [['default'], [], []],
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
  const page = await browser.newPage({ locale: ROOT_CONTEXT_LOCALE, viewport: { width: 390, height: 844 } });

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
  const page = await browser.newPage({ locale: ROOT_CONTEXT_LOCALE, viewport: { width: 1280, height: 900 } });

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  async function measure(path, experienceTitle) {
    const response = await page.goto(`${server.origin}${path}`, { waitUntil: 'networkidle' });

    assert.ok(response?.ok(), `Expected ${path} to load, received HTTP ${response?.status() ?? 'unknown'}.`);

    return page.evaluate((experienceTitle) => {
      const edges = (element) => {
        const { left, right } = element.getBoundingClientRect();

        return { left, right };
      };
      const frame = document.querySelector(`main section[aria-label="${experienceTitle}"]`);
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
    }, experienceTitle);
  }

  const ltr = await measure('/', fr.cv.professionalExperience.title);
  const rtl = await measure('/ar/', 'الخبرة المهنية');

  assert.ok(ltr.aside.left > ltr.frame.right, 'Expected the French sidebar on the right of the main column.');
  assert.ok(rtl.aside.right < rtl.frame.left, 'Expected the Arabic sidebar on the left of the main column.');
  assert.ok(ltr.frame.right - ltr.counter.right < 32, 'Expected the French section counter against the frame end edge.');
  assert.ok(rtl.counter.left - rtl.frame.left < 32, 'Expected the Arabic section counter against the frame start edge.');
  assert.equal(ltr.factValueAlign, 'end');
  assert.equal(rtl.factValueAlign, 'end');
});

test('/ar/ rend son interface, ses chiffres et son interlignage en arabe sans altérer les chemins', async (t) => {
  const server = await startBuildServer(DIST_DIRECTORY);
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: 'ar' });

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  await page.goto(`${server.origin}/ar/`, { waitUntil: 'networkidle' });

  const rendered = await page.evaluate(() => {
    const aboutHeading = Array.from(document.querySelectorAll('h2')).find((heading) => heading.textContent?.trim() === 'نبذة');
    const prose = aboutHeading?.nextElementSibling;
    const download = document.querySelector('a[download]');

    if (!prose || !download) throw new Error('Unable to find the Arabic prose or PDF link.');

    const proseStyle = getComputedStyle(prose);

    return {
      accessibleText: [
        document.body.innerText,
        ...Array.from(document.querySelectorAll('[aria-label]'), (element) => element.getAttribute('aria-label') ?? ''),
      ].join('\n'),
      name: document.querySelector('h1')?.innerText,
      proseLineHeightRatio: Number.parseFloat(proseStyle.lineHeight) / Number.parseFloat(proseStyle.fontSize),
      pdfHref: download.getAttribute('href'),
      pdfFileName: download.getAttribute('download'),
      ltrIslandCount: document.querySelectorAll('[dir="ltr"]').length,
      asideLabel: document.querySelector('aside')?.getAttribute('aria-label'),
    };
  });

  for (const expected of ['معلومات الاتصال', 'الفترة', 'قيد التنفيذ', 'تغيير اللغة', ar.cv.about.paragraphs[0]]) {
    assert.ok(rendered.accessibleText.includes(expected), `Expected /ar/ to render “${expected}”.`);
  }

  assert.equal(rendered.asideLabel, 'معلومات إضافية');
  assert.match(rendered.name ?? '', /محسن عزيز.*Mohsan AZIZ/s);
  assert.doesNotMatch(rendered.accessibleText, /[0-9]/, 'Expected every visible or aria-labelled number on /ar/ to use Arabic digits.');
  assert.ok(
    Math.abs(rendered.proseLineHeightRatio - localeFormatting('ar').lineHeight) < 0.001,
    `Expected Arabic prose line-height ${localeFormatting('ar').lineHeight}, got ${rendered.proseLineHeightRatio}.`,
  );
  assert.equal(rendered.pdfHref, '/cv/CV-ar.pdf');
  assert.equal(rendered.pdfFileName, 'CV-ar.pdf');
  assert.equal(rendered.ltrIslandCount, 0);

  await page.goto(`${server.origin}/ar/cv-print/`, { waitUntil: 'networkidle' });

  const printableAccessibleText = await page.evaluate(() =>
    [
      document.body.innerText,
      ...Array.from(document.querySelectorAll('[aria-label]'), (element) => element.getAttribute('aria-label') ?? ''),
    ].join('\n'),
  );

  assert.doesNotMatch(
    printableAccessibleText,
    /[0-9]/,
    'Expected every visible or aria-labelled number on /ar/cv-print/ to use Arabic digits.',
  );
});

test('/en/ ne laisse subsister aucune chaîne française là où l’anglais diffère', async () => {
  const html = decodeHtml(await readBuiltPage('en'));
  const englishStrings = new Map(flattenStrings({ ...en.messages, ...en.cv }));

  for (const [path, frenchValue] of flattenStrings({ ...fr.messages, ...fr.cv })) {
    if (englishStrings.get(path) === frenchValue) continue;

    assert.ok(!html.includes(frenchValue), `Expected the English page to drop the French “${path}”: “${frenchValue}”.`);
  }
});

test('/ar/ ne laisse subsister aucune chaîne française là où l’arabe diffère', async () => {
  const html = decodeHtml(await readBuiltPage('ar'));
  const arabicStrings = new Map(flattenStrings({ ...ar.messages, ...ar.cv }));

  for (const [path, frenchValue] of flattenStrings({ ...fr.messages, ...fr.cv })) {
    if (arabicStrings.get(path) === frenchValue) continue;

    assert.ok(!html.includes(frenchValue), `Expected the Arabic page to drop the French “${path}”: “${frenchValue}”.`);
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

test('le lexique GitHub reste en anglais dans les trois locales', async () => {
  for (const locale of LOCALES) {
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
