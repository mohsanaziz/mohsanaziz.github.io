import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { fonts, provisionFont, sha256 } from '../scripts/download-fonts.mjs';

const fontFixture = Buffer.from('verified font fixture');
const font = {
  family: 'Test font',
  version: '1.0',
  subset: 'fixture',
  fileName: 'test.woff2',
  url: 'https://example.com/test.woff2',
  expectedSha256: sha256(fontFixture),
};

test('les deux sous-ensembles épinglent explicitement Noto Sans Arabic v2.012', () => {
  assert.deepEqual(
    fonts.map(({ family, version, subset }) => ({ family, version, subset })),
    [
      { family: 'Noto Sans Arabic', version: '2.012', subset: 'latin' },
      { family: 'Noto Sans Arabic', version: '2.012', subset: 'arabic' },
    ],
  );
});

async function temporaryFontDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), 'cv-font-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('provisionFont télécharge et écrit un fichier dont le SHA-256 est attendu', async (t) => {
  const directory = await temporaryFontDirectory(t);

  await provisionFont(font, {
    directory,
    fetchFont: async () => new Response(fontFixture),
  });

  assert.deepEqual(await readFile(join(directory, font.fileName)), fontFixture);
});

test('provisionFont échoue bruyamment avant écriture lorsque le SHA-256 diffère', async (t) => {
  const directory = await temporaryFontDirectory(t);

  await assert.rejects(
    provisionFont(font, {
      directory,
      fetchFont: async () => new Response('unexpected font'),
    }),
    /Unexpected Test font v1\.0 fixture subset SHA-256/,
  );

  await assert.rejects(readFile(join(directory, font.fileName)), { code: 'ENOENT' });
});

test('provisionFont conserve un fichier déjà vérifié sans requête réseau', async (t) => {
  const directory = await temporaryFontDirectory(t);
  await writeFile(join(directory, font.fileName), fontFixture);

  await provisionFont(font, {
    directory,
    fetchFont: async () => {
      assert.fail('A verified font must not be downloaded again.');
    },
  });

  assert.deepEqual(await readFile(join(directory, font.fileName)), fontFixture);
});
