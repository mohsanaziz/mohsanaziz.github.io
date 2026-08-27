import assert from 'node:assert/strict';
import test from 'node:test';

import { cv } from '../src/data/cv.ts';
import * as ar from '../src/i18n/ar.ts';
import * as en from '../src/i18n/en.ts';
import * as fr from '../src/i18n/fr.ts';
import { localeLayer } from '../src/i18n/layers.ts';
import { LOCALES } from '../src/i18n/locales.ts';
import { formatMessage } from '../src/i18n/messages.ts';
import { useTranslations } from '../src/i18n/translate.ts';
import { cvView, releaseAssetView } from '../src/i18n/views.ts';
import { flattenStrings, stringPaths } from './layer-strings.mjs';

// The three layers are typed complete, so `astro check` already refuses an incomplete one.
// These tests cover what the type system cannot see: the values themselves and the rendering rules.

test('les calques fr, en et ar sont symétriques, clé pour clé', () => {
  assert.deepEqual(stringPaths(fr.messages), stringPaths(en.messages));
  assert.deepEqual(stringPaths(fr.cv), stringPaths(en.cv));
  // The Arabic layer adds the one optional leaf the schema allows: the transliterated name.
  assert.deepEqual(
    stringPaths(ar.cv).filter((path) => path !== 'profile.name'),
    stringPaths(fr.cv),
  );
});

test('le noyau invariant ne porte aucune phrase de langue naturelle', () => {
  // A named entity is invariant and stays in the core; a sentence is not, and a paragraph even less.
  const MAXIMUM_CORE_STRING_LENGTH = 60;

  for (const value of Array.from(JSON.stringify(cv).matchAll(/"([^"]*)"/g), ([, value]) => value)) {
    assert.doesNotMatch(value, /[.!?](\s|$)/, `Expected no sentence in the CV core, found “${value}”.`);
    assert.ok(value.length <= MAXIMUM_CORE_STRING_LENGTH, `Expected no prose in the CV core, found “${value}”.`);
  }
});

test('chaque locale déclarée dispose d’un calque', () => {
  for (const locale of LOCALES) {
    const { messages, cv: content } = localeLayer(locale);

    assert.ok(messages.labels.contact.length > 0);
    assert.ok(content.about.paragraphs.length > 0);
  }
});

test('formatMessage substitue les espaces réservés et refuse une valeur manquante', () => {
  assert.equal(formatMessage('Stack : {mission}', { mission: 'SPS' }), 'Stack : SPS');
  assert.equal(formatMessage('{count} versions', { count: 6 }), '6 versions');
  assert.equal(formatMessage('sans espace réservé', {}), 'sans espace réservé');
  assert.throws(() => formatMessage('{count} versions', {}), /count/);
});

test('les pluriels sont sélectionnés par Intl.PluralRules, sans comparaison à 1', () => {
  const french = useTranslations('fr');
  const english = useTranslations('en');

  assert.equal(french.count('employer', 0), '0 employeur');
  assert.equal(french.count('employer', 1), '1 employeur');
  assert.equal(french.count('employer', 2), '2 employeurs');
  assert.equal(english.count('employer', 0), '0 employers');
  assert.equal(english.count('employer', 1), '1 employer');
  assert.equal(english.count('employer', 2), '2 employers');
});

test('l’étiquette de pile ne calcule aucune élision et nomme la mission', () => {
  const french = useTranslations('fr');
  const english = useTranslations('en');

  assert.equal(formatMessage(french.messages.accessibility.missionStack, { mission: 'ATLAS IHM' }), 'Stack : ATLAS IHM');
  assert.equal(formatMessage(english.messages.accessibility.missionStack, { mission: 'IMS' }), 'Stack: IMS');
});

test('les intitulés de fait reçoivent le deux-points de leur locale', () => {
  assert.equal(useTranslations('fr').fieldLabel('Client'), 'Client :');
  assert.equal(useTranslations('en').fieldLabel('Client'), 'Client:');
});

test('les parts de langage sont formatées par Intl dans chaque locale', () => {
  assert.equal(useTranslations('en').percentage(37), '37%');
  assert.match(useTranslations('fr').percentage(37), /^37\s%$/);
});

test('la vue porte l’image du noyau et son texte de remplacement traduit', () => {
  assert.deepEqual(cvView('fr').profile.image, { source: cv.profile.image.source, alt: 'Photo de Mohsan AZIZ' });
  assert.deepEqual(cvView('en').profile.image, { source: cv.profile.image.source, alt: 'Portrait of Mohsan AZIZ' });
});

test('la vue de CV fusionne le noyau et le calque de la locale', () => {
  const french = cvView('fr');
  const english = cvView('en');
  const missionIds = cv.clientProjects.entries.map(({ id }) => id);

  assert.deepEqual(
    english.clientProjects.entries.map(({ id }) => id),
    missionIds,
  );
  assert.equal(english.profile.name, 'Mohsan AZIZ', 'Expected the invariant name when no layer overrides it.');
  assert.equal(english.profile.jobTitle, 'Freelance Angular/Java Developer');
  assert.equal(french.profile.jobTitle, 'Développeur freelance Angular/Java');
});

test('une institution est traduite, une entité nommée reste invariante', () => {
  const clientOf = (view, id) => view.clientProjects.entries.find((entry) => entry.id === id)?.client;

  assert.equal(clientOf(cvView('fr'), 'sps'), 'Ministère de la Justice');
  assert.equal(clientOf(cvView('en'), 'sps'), 'French Ministry of Justice');
  assert.equal(clientOf(cvView('fr'), 'atlasIhm'), 'Saint-Gobain');
  assert.equal(clientOf(cvView('en'), 'atlasIhm'), 'Saint-Gobain');
});

test('les coordonnées invariantes viennent du noyau, les autres du calque', () => {
  const detailOf = (view, id) => view.profile.contactDetails.find((detail) => detail.id === id);

  assert.deepEqual(detailOf(cvView('en'), 'email'), {
    id: 'email',
    title: 'Email',
    info: 'mohsan.aziz@gmail.com',
    icon: 'mail',
    href: 'mailto:mohsan.aziz@gmail.com',
  });
  assert.equal(detailOf(cvView('fr'), 'birthdate')?.info, '19 Octobre 1989');
  assert.equal(detailOf(cvView('en'), 'birthdate')?.info, '19 October 1989');
});

test('le calque arabe porte son interface et sa prose sans repli sur le français', () => {
  const arabic = localeLayer('ar');
  const frenchStrings = new Set(flattenStrings({ ...fr.messages, ...fr.cv }).map(([, value]) => value));

  assert.equal(arabic.messages.labels.period, 'الفترة');
  assert.equal(arabic.cv.about.title, 'نبذة');
  assert.equal(arabic.cv.about.paragraphs.length, fr.cv.about.paragraphs.length);

  for (const [path, value] of flattenStrings(arabic.cv)) {
    assert.ok(!frenchStrings.has(value), `Expected the Arabic layer to translate “${path}”, found the French “${value}”.`);
  }
});

test('la vue arabe localise les chiffres affichés tout en conservant les cibles ASCII', () => {
  const arabic = cvView('ar');
  const phone = arabic.profile.contactDetails.find(({ id }) => id === 'phone');
  const birthdate = arabic.profile.contactDetails.find(({ id }) => id === 'birthdate');
  const portalis = arabic.clientProjects.entries.find(({ id }) => id === 'portalisV3');

  assert.deepEqual(
    {
      name: arabic.profile.name,
      alternateName: arabic.profile.alternateName,
      phone,
      birthdate: birthdate?.info,
      project: portalis?.name,
      paragraph: arabic.about.paragraphs[0],
    },
    {
      name: 'محسن عزيز',
      alternateName: 'Mohsan AZIZ',
      phone: { id: 'phone', title: 'الهاتف', info: '٠٦.٢٨.٧٤.٦١.٧٦', icon: 'phone', href: 'tel:+33628746176' },
      birthdate: '١٩ أكتوبر ١٩٨٩',
      project: 'PORTALIS V٣',
      paragraph: ar.cv.about.paragraphs[0],
    },
  );
});

test('la vue de release localise sa version sans altérer le chemin ou le nom du PDF', () => {
  assert.deepEqual(releaseAssetView('ar', '2.1.0'), {
    version: 'v٢.١.٠',
    href: '/cv/CV-ar.pdf',
    fileName: 'CV-ar.pdf',
  });
});
