import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { LOCALES } from '../src/i18n/locales.ts';
import { localeDirection, localeUrlSegment, resumePath } from '../src/i18n/routing.ts';

const DIST_DIRECTORY = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));

function builtPagePath(locale, page = '') {
  return resolve(DIST_DIRECTORY, ...[localeUrlSegment(locale), page, 'index.html'].filter(Boolean));
}

async function readBuiltPage(locale, page) {
  return readFile(builtPagePath(locale, page), 'utf8');
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
    for (const page of ['', 'cv-print']) {
      const { lang, dir } = htmlAttributes(await readBuiltPage(locale, page));

      assert.equal(lang, locale, `Expected /${localeUrlSegment(locale) ?? ''} ${page} to declare lang="${locale}".`);
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
    for (const page of ['', 'cv-print']) {
      const html = await readBuiltPage(locale, page);

      assert.doesNotMatch(html, /<script\b/);
      assert.doesNotMatch(html, /http-equiv="refresh"/i);
    }
  }
});
