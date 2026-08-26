import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_LOCALE, LOCALES } from '../src/i18n/locales.ts';
import {
  localeDirection,
  localePagePath,
  localeRoutes,
  localeStaticPaths,
  openGraphImageFileName,
  openGraphImagePath,
  resumeFileName,
  resumePath,
} from '../src/i18n/routing.ts';

test('les trois locales sont déclarées une seule fois, le français par défaut', () => {
  assert.deepEqual([...LOCALES], ['fr', 'en', 'ar']);
  assert.equal(DEFAULT_LOCALE, 'fr');
});

test('getStaticPaths énumère une page par locale, le français sans préfixe', () => {
  assert.deepEqual(localeRoutes(), [
    { locale: 'fr', urlSegment: undefined },
    { locale: 'en', urlSegment: 'en' },
    { locale: 'ar', urlSegment: 'ar' },
  ]);
  assert.deepEqual(localeStaticPaths(), [{ params: { locale: undefined } }, { params: { locale: 'en' } }, { params: { locale: 'ar' } }]);
});

test('seul l’arabe s’écrit de droite à gauche', () => {
  assert.equal(localeDirection('fr'), 'ltr');
  assert.equal(localeDirection('en'), 'ltr');
  assert.equal(localeDirection('ar'), 'rtl');
});

test('le PDF reste groupé sous /cv/ et son nom de fichier est le dernier segment du chemin', () => {
  for (const locale of LOCALES) {
    const path = resumePath(locale);

    assert.match(path, /^\/cv\/[^/]+\.pdf$/);
    assert.equal(path.split('/').at(-1), resumeFileName(locale));
  }

  assert.equal(resumePath('fr'), '/cv/CV.pdf');
  assert.equal(resumeFileName('fr'), 'CV.pdf');
  assert.equal(resumePath('en'), '/cv/CV-en.pdf');
  assert.equal(resumeFileName('en'), 'CV-en.pdf');
  assert.equal(resumePath('ar'), '/cv/CV-ar.pdf');
  assert.equal(resumeFileName('ar'), 'CV-ar.pdf');
});

test('les routes de capture et les cartes Open Graph suivent les chemins localisés déclarés', () => {
  assert.deepEqual(
    LOCALES.map((locale) => ({
      locale,
      printRoute: localePagePath(locale, 'cv-print'),
      cardRoute: localePagePath(locale, 'og-card'),
      imagePath: openGraphImagePath(locale),
      imageFileName: openGraphImageFileName(locale),
    })),
    [
      { locale: 'fr', printRoute: '/cv-print', cardRoute: '/og-card', imagePath: '/og/cv-fr.png', imageFileName: 'cv-fr.png' },
      { locale: 'en', printRoute: '/en/cv-print', cardRoute: '/en/og-card', imagePath: '/og/cv-en.png', imageFileName: 'cv-en.png' },
      { locale: 'ar', printRoute: '/ar/cv-print', cardRoute: '/ar/og-card', imagePath: '/og/cv-ar.png', imageFileName: 'cv-ar.png' },
    ],
  );
});
