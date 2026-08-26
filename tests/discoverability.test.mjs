import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import astroConfig from '../astro.config.mjs';
import { cv } from '../src/data/cv.ts';
import { DEFAULT_LOCALE, LOCALES } from '../src/i18n/locales.ts';
import { localeUrlSegment } from '../src/i18n/routing.ts';

const DIST_DIRECTORY = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const SITE = new URL(astroConfig.site);
const OPEN_GRAPH_LOCALES = {
  fr: 'fr_FR',
  en: 'en_GB',
  ar: 'ar_AR',
};

function builtPagePath(locale, route = '') {
  return resolve(DIST_DIRECTORY, ...[localeUrlSegment(locale), route, 'index.html'].filter(Boolean));
}

function publicUrl(locale) {
  const segment = localeUrlSegment(locale);

  return new URL(segment === undefined ? '/' : `/${segment}/`, SITE).href;
}

function attributes(tag) {
  return Object.fromEntries(Array.from(tag.matchAll(/([:\w-]+)="([^"]*)"/g), ([, name, value]) => [name, value]));
}

function headTags(html, tagName) {
  const [, head] = html.match(/<head>([\s\S]*?)<\/head>/) ?? [];

  assert.ok(head, 'Expected the built page to contain a <head>.');

  return Array.from(head.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'g')), ([tag]) => attributes(tag));
}

function singleValue(values, label) {
  assert.equal(values.length, 1, `Expected exactly one ${label}, received ${values.length}.`);

  return values[0];
}

function metadataValues(metaTags, attribute, name) {
  return metaTags.filter((meta) => meta[attribute] === name).map((meta) => meta.content);
}

test('les pages publiques forment un groupe canonical/hreflang réciproque et complet', async () => {
  const expectedAlternates = Object.fromEntries(LOCALES.map((locale) => [locale, publicUrl(locale)]));
  const defaultUrl = publicUrl(DEFAULT_LOCALE);

  for (const locale of LOCALES) {
    const html = await readFile(builtPagePath(locale), 'utf8');
    const links = headTags(html, 'link');
    const canonical = singleValue(
      links.filter(({ rel }) => rel === 'canonical').map(({ href }) => href),
      `canonical on ${publicUrl(locale)}`,
    );
    const alternates = Object.fromEntries(
      links.filter(({ rel, hreflang }) => rel === 'alternate' && hreflang).map(({ hreflang, href }) => [hreflang, href]),
    );

    assert.equal(canonical, publicUrl(locale), `Expected ${publicUrl(locale)} to be self-canonical.`);
    assert.deepEqual(alternates, { ...expectedAlternates, 'x-default': defaultUrl });
    assert.equal(alternates[locale], canonical, `Expected ${locale} to include itself in its hreflang group.`);
  }
});

test('les pages publiques reprennent leur titre, leur description et leur URL dans le bloc Open Graph', async () => {
  const [firstName, ...lastNameParts] = cv.profile.name.split(' ');
  const lastName = lastNameParts.join(' ');

  for (const locale of LOCALES) {
    const html = await readFile(builtPagePath(locale), 'utf8');
    const [, title] = html.match(/<title>([^<]*)<\/title>/) ?? [];
    const meta = headTags(html, 'meta');
    const description = singleValue(metadataValues(meta, 'name', 'description'), `description on ${publicUrl(locale)}`);
    const openGraphLocale = OPEN_GRAPH_LOCALES[locale];
    const expectedAlternateLocales = LOCALES.filter((alternate) => alternate !== locale).map((alternate) => OPEN_GRAPH_LOCALES[alternate]);

    assert.ok(title, `Expected ${publicUrl(locale)} to contain a title.`);
    assert.equal(singleValue(metadataValues(meta, 'property', 'og:url'), 'og:url'), publicUrl(locale));
    assert.equal(singleValue(metadataValues(meta, 'property', 'og:site_name'), 'og:site_name'), 'mohsanaziz/cv');
    assert.equal(singleValue(metadataValues(meta, 'property', 'og:type'), 'og:type'), 'profile');
    assert.equal(singleValue(metadataValues(meta, 'property', 'profile:first_name'), 'profile:first_name'), firstName);
    assert.equal(singleValue(metadataValues(meta, 'property', 'profile:last_name'), 'profile:last_name'), lastName);
    assert.equal(singleValue(metadataValues(meta, 'property', 'og:title'), 'og:title'), title);
    assert.equal(singleValue(metadataValues(meta, 'property', 'og:description'), 'og:description'), description);
    assert.equal(singleValue(metadataValues(meta, 'property', 'og:locale'), 'og:locale'), openGraphLocale);
    assert.deepEqual(metadataValues(meta, 'property', 'og:locale:alternate'), expectedAlternateLocales);
    assert.equal(singleValue(metadataValues(meta, 'name', 'twitter:card'), 'twitter:card'), 'summary_large_image');
  }
});

test('les pages techniques restent noindex et ne portent aucun bloc de découvrabilité', async () => {
  for (const locale of LOCALES) {
    const html = await readFile(builtPagePath(locale, 'cv-print'), 'utf8');
    const links = headTags(html, 'link');
    const meta = headTags(html, 'meta');

    assert.deepEqual(metadataValues(meta, 'name', 'robots'), ['noindex, nofollow']);
    assert.equal(
      links.some(({ rel }) => rel === 'canonical' || rel === 'alternate'),
      false,
    );
    assert.equal(
      meta.some(({ property }) => property?.startsWith('og:') || property?.startsWith('profile:')),
      false,
    );
    assert.equal(
      meta.some(({ name }) => name?.startsWith('twitter:')),
      false,
    );
  }
});

test('robots.txt bloque les PDF sans masquer les pages techniques ni les futures cartes', async () => {
  const robotsPath = resolve(DIST_DIRECTORY, 'robots.txt');

  await access(robotsPath);

  const robots = await readFile(robotsPath, 'utf8');
  const directives = robots
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/:\s*/, 2));
  const disallowedPaths = directives.filter(([name]) => name.toLowerCase() === 'disallow').map(([, path]) => path);
  const isDisallowed = (path) => disallowedPaths.some((rule) => path.startsWith(rule));

  assert.deepEqual(directives, [
    ['User-agent', '*'],
    ['Disallow', '/cv/'],
  ]);
  assert.equal(isDisallowed('/cv/CV.pdf'), true);
  assert.equal(isDisallowed('/cv-print/'), false);
  assert.equal(isDisallowed('/og/cv-fr.png'), false);
});
