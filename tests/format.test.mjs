import assert from 'node:assert/strict';
import test from 'node:test';

import { formatVersion } from '../src/i18n/format.ts';
import { useTranslations } from '../src/i18n/translate.ts';
import { cvView, buildMissionReleaseViews } from '../src/i18n/views.ts';

const french = useTranslations('fr');
const english = useTranslations('en');
const arabic = useTranslations('ar');

test('formatPeriod rend une période close dans la locale courante via Intl', () => {
  assert.equal(french.period({ start: '2016-05', end: '2019-09' }), 'Mai 2016 - Septembre 2019');
  assert.equal(french.period({ start: '2020-02', end: '2021-12' }), 'Février 2020 - Décembre 2021');
  assert.equal(english.period({ start: '2016-05', end: '2019-09' }), 'May 2016 - September 2019');
  assert.equal(arabic.period({ start: '2016-05', end: '2019-09' }), 'مايو ٢٠١٦ - سبتمبر ٢٠١٩');
});

test('formatPeriod rend une période en cours avec la borne du calque', () => {
  assert.equal(french.period({ start: '2019-11', end: null }), "Novembre 2019 - Aujourd'hui");
  assert.equal(english.period({ start: '2019-11', end: null }), 'November 2019 - Present');
});

test('formatPeriod rejette une borne non machine', () => {
  assert.throws(() => french.period({ start: 'Novembre 2019', end: null }));
  assert.throws(() => french.period({ start: '2019-13', end: null }));
  assert.throws(() => french.period({ start: '2019-11', end: '2019-0' }));
});

test('formatDuration décline mois, ans et combinaisons dans chaque locale', () => {
  assert.equal(french.duration(1), '1 mois');
  assert.equal(french.duration(11), '11 mois');
  assert.equal(french.duration(12), '1 an');
  assert.equal(french.duration(13), '1 an 1 mois');
  assert.equal(french.duration(24), '2 ans');
  assert.equal(french.duration(81), '6 ans 9 mois');
  assert.equal(english.duration(1), '1 month');
  assert.equal(english.duration(12), '1 year');
  assert.equal(english.duration(81), '6 years 9 months');
});

test('les jetons de contrat et de statut sont traduits par table, pas par libellé', () => {
  assert.equal(french.contract('freelance'), 'Freelance');
  assert.equal(french.contract('permanent'), 'CDI');
  assert.equal(french.missionStatus('current'), 'En cours');
  assert.equal(french.missionStatus('delivered'), 'Livrée');
  assert.equal(english.contract('permanent'), 'Permanent');
  assert.equal(english.missionStatus('delivered'), 'Delivered');
});

test('formatVersion rend un numéro structurel en étiquette de version', () => {
  assert.equal(formatVersion('fr', 6), 'v6.0.0');
});

test('le traducteur arabe rend la version avec des chiffres arabes', () => {
  assert.equal(arabic.version(6), 'v٦.٠.٠');
});

test('les six catégories de pluriel arabes rendent leurs formes avec des chiffres arabes', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 11, 100].map((count) => arabic.count('version', count)),
    ['٠ إصدار', '١ إصدار', '٢ إصداران', '٣ إصدارات', '١١ إصدارًا', '١٠٠ إصدار'],
  );
});

test('buildMissionReleaseViews assemble la vue affichable d’un résumé structurel', () => {
  const release = {
    missionId: 'atlasIhm',
    summary: {
      period: { start: '2022-09', end: null },
      durationInMonths: 47,
      status: 'current',
      employerId: 'azmopak',
      versionNumber: 6,
    },
    showStatusBadge: true,
  };

  const [{ mission, summary, showStatusBadge }] = buildMissionReleaseViews(french, cvView('fr'), [release]);

  assert.equal(mission.name, 'ATLAS IHM');
  assert.equal(showStatusBadge, true);
  assert.deepEqual(summary, {
    client: 'Saint-Gobain',
    period: "Septembre 2022 - Aujourd'hui",
    duration: '3 ans 11 mois',
    status: 'En cours',
    employer: 'SASU AZMOPAK',
    version: 'v6.0.0',
    technologies: cvView('fr').clientProjects.entries.find(({ id }) => id === 'atlasIhm').technologies,
  });

  const [englishRelease] = buildMissionReleaseViews(english, cvView('en'), [release]);

  assert.equal(englishRelease.summary.period, 'September 2022 - Present');
  assert.equal(englishRelease.summary.duration, '3 years 11 months');
  assert.equal(englishRelease.summary.status, 'In progress');
});
