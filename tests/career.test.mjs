import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countMissionsByEmployer,
  getCareerDurationInYears,
  getPeriodDurationInMonths,
  mapMissionsToEmployers,
  sortByMostRecentPeriod,
} from '../src/data/career.ts';

// Août 2026 : mois figé pour rendre les périodes « en cours » déterministes.
const CURRENT_DATE = new Date(2026, 7, 23);

const EMPLOYERS = [
  { id: 'azmopak', period: { start: '2019-11', end: null } },
  { id: 'sopraSteria', period: { start: '2016-05', end: '2019-09' } },
];

test('getPeriodDurationInMonths compte les mois entre deux bornes machine', () => {
  assert.equal(getPeriodDurationInMonths({ start: '2022-03', end: '2022-06' }, CURRENT_DATE), 3);
  assert.equal(getPeriodDurationInMonths({ start: '2018-04', end: '2019-09' }, CURRENT_DATE), 17);
});

test('getPeriodDurationInMonths dure au moins un mois', () => {
  assert.equal(getPeriodDurationInMonths({ start: '2019-11', end: '2019-11' }, CURRENT_DATE), 1);
});

test('getPeriodDurationInMonths borne une période en cours à la date courante', () => {
  assert.equal(getPeriodDurationInMonths({ start: '2019-11', end: null }, CURRENT_DATE), 81);
});

test('getPeriodDurationInMonths rejette une borne non machine', () => {
  assert.throws(() => getPeriodDurationInMonths({ start: 'Novembre 2019', end: null }, CURRENT_DATE));
  assert.throws(() => getPeriodDurationInMonths({ start: '2019-13', end: null }, CURRENT_DATE));
  assert.throws(() => getPeriodDurationInMonths({ start: '2019-00', end: null }, CURRENT_DATE));
});

test('sortByMostRecentPeriod trie par début décroissant sans muter la source', () => {
  const entries = [
    { id: 'ims', period: { start: '2019-11', end: '2019-12' } },
    { id: 'atlasIhm', period: { start: '2022-09', end: null } },
    { id: 'sps', period: { start: '2022-03', end: '2022-06' } },
  ];
  const sorted = sortByMostRecentPeriod(entries);

  assert.deepEqual(
    sorted.map(({ id }) => id),
    ['atlasIhm', 'sps', 'ims'],
  );
  assert.equal(entries[0].id, 'ims');
});

test('sortByMostRecentPeriod départage un même début par la fin, période en cours en tête', () => {
  const entries = [
    { id: 'delivered', period: { start: '2022-09', end: '2023-01' } },
    { id: 'current', period: { start: '2022-09', end: null } },
  ];

  assert.deepEqual(
    sortByMostRecentPeriod(entries).map(({ id }) => id),
    ['current', 'delivered'],
  );
});

test('mapMissionsToEmployers rattache chaque mission au dernier employeur commencé avant elle', () => {
  const missions = [
    { id: 'atlasIhm', period: { start: '2022-09', end: null } },
    { id: 'portalisV3', period: { start: '2018-04', end: '2019-09' } },
    { id: 'ims', period: { start: '2019-11', end: '2019-12' } },
  ];
  const employersByMission = mapMissionsToEmployers(EMPLOYERS, missions);

  assert.equal(employersByMission.get('atlasIhm'), 'azmopak');
  assert.equal(employersByMission.get('portalisV3'), 'sopraSteria');
  assert.equal(employersByMission.get('ims'), 'azmopak');
});

test('mapMissionsToEmployers rejette une mission sans employeur antérieur', () => {
  assert.throws(() => mapMissionsToEmployers(EMPLOYERS, [{ id: 'orphan', period: { start: '2015-01', end: '2015-06' } }]));
});

test('countMissionsByEmployer compte les missions par identifiant, zéros compris', () => {
  const employersByMission = new Map([
    ['atlasIhm', 'azmopak'],
    ['ims', 'azmopak'],
  ]);
  const counts = countMissionsByEmployer(EMPLOYERS, employersByMission);

  assert.equal(counts.get('azmopak'), 2);
  assert.equal(counts.get('sopraSteria'), 0);
});

test('countMissionsByEmployer rejette un rattachement vers un employeur inconnu', () => {
  assert.throws(() => countMissionsByEmployer(EMPLOYERS, new Map([['atlasIhm', 'unknown']])));
});

test('getCareerDurationInYears couvre du premier début à la dernière fin, en années pleines', () => {
  assert.equal(getCareerDurationInYears(EMPLOYERS, CURRENT_DATE), 10);
  assert.equal(getCareerDurationInYears([], CURRENT_DATE), 0);
});
