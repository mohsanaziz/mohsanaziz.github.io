import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveMissionReleases } from '../src/data/missions.ts';

const CURRENT_DATE = new Date(2026, 7, 23);

test('deriveMissionReleases ne rend que les données structurelles de la mission', () => {
  const mission = {
    id: 'atlasIhm',
    period: { start: '2022-09', end: null },
    title: 'ATLAS IHM',
    description: ['Contenu localisé'],
  };

  assert.deepEqual(deriveMissionReleases([mission], new Map([['atlasIhm', 'azmopak']]), CURRENT_DATE), [
    {
      missionId: 'atlasIhm',
      summary: {
        period: { start: '2022-09', end: null },
        durationInMonths: 47,
        status: 'current',
        employerId: 'azmopak',
        versionNumber: 1,
      },
      showStatusBadge: true,
    },
  ]);
});
