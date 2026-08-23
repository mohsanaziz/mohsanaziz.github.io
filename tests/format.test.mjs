import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CONTRACT_LABELS,
  MISSION_STATUS_LABELS,
  formatDurationInMonths,
  formatMissionSummary,
  formatPeriod,
  formatVersion,
} from '../src/i18n/format.ts';

test('formatPeriod rend une période close en français via Intl', () => {
  assert.equal(formatPeriod({ start: '2016-05', end: '2019-09' }), 'Mai 2016 - Septembre 2019');
  assert.equal(formatPeriod({ start: '2020-02', end: '2021-12' }), 'Février 2020 - Décembre 2021');
  assert.equal(formatPeriod({ start: '2018-04', end: '2018-08' }), 'Avril 2018 - Août 2018');
});

test("formatPeriod rend une période en cours avec la borne « Aujourd'hui »", () => {
  assert.equal(formatPeriod({ start: '2019-11', end: null }), "Novembre 2019 - Aujourd'hui");
});

test('formatPeriod rejette une borne non machine', () => {
  assert.throws(() => formatPeriod({ start: 'Novembre 2019', end: null }));
  assert.throws(() => formatPeriod({ start: '2019-13', end: null }));
  assert.throws(() => formatPeriod({ start: '2019-11', end: '2019-0' }));
});

test('formatDurationInMonths décline mois, ans et combinaisons', () => {
  assert.equal(formatDurationInMonths(1), '1 mois');
  assert.equal(formatDurationInMonths(11), '11 mois');
  assert.equal(formatDurationInMonths(12), '1 an');
  assert.equal(formatDurationInMonths(13), '1 an 1 mois');
  assert.equal(formatDurationInMonths(24), '2 ans');
  assert.equal(formatDurationInMonths(81), '6 ans 9 mois');
});

test('les jetons de contrat et de statut sont traduits par table, pas par libellé', () => {
  assert.equal(CONTRACT_LABELS.freelance, 'Freelance');
  assert.equal(CONTRACT_LABELS.permanent, 'CDI');
  assert.equal(MISSION_STATUS_LABELS.current, 'En cours');
  assert.equal(MISSION_STATUS_LABELS.delivered, 'Livrée');
});

test('formatVersion rend un numéro structurel en étiquette de version', () => {
  assert.equal(formatVersion(6), 'v6.0.0');
});

test("formatMissionSummary assemble la vue affichable d'un résumé structurel", () => {
  const view = formatMissionSummary(
    {
      period: { start: '2022-09', end: null },
      durationInMonths: 47,
      status: 'current',
      employerId: 'azmopak',
      versionNumber: 6,
    },
    { subtitle: 'Saint-Gobain', technologies: ['Java', 'Angular'] },
    'SASU AZMOPAK',
  );

  assert.deepEqual(view, {
    client: 'Saint-Gobain',
    period: "Septembre 2022 - Aujourd'hui",
    duration: '3 ans 11 mois',
    status: 'En cours',
    employer: 'SASU AZMOPAK',
    version: 'v6.0.0',
    technologies: ['Java', 'Angular'],
  });
});
