import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_LOCALE, LOCALES } from '../src/i18n/locales.ts';
import { localeDirection, localeStaticPaths, resumeFileName, resumePath } from '../src/i18n/routing.ts';

test('les trois locales sont déclarées une seule fois, le français par défaut', () => {
  assert.deepEqual([...LOCALES], ['fr', 'en', 'ar']);
  assert.equal(DEFAULT_LOCALE, 'fr');
});

test('getStaticPaths énumère une page par locale, le français sans préfixe', () => {
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
});
