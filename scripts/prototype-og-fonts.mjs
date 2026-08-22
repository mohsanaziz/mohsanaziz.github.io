// PROTOTYPE — jetable. Voir src/prototype-og/README.md (issue #82).
// Télécharge Noto Sans Arabic, arbitrée par la recherche #61, pour la carte arabe.
// Pas de nastaliq : le périmètre est passé à trois locales (#68). TTF variable brut —
// le prototype juge le rendu, pas le poids réseau.
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const run = promisify(execFile);
const fontDirectory = new URL('../public/fonts/prototype-og/', import.meta.url);

const FONT = {
  name: 'NotoSansArabic.ttf',
  url: 'https://github.com/notofonts/arabic/releases/download/NotoSansArabic-v2.012/NotoSansArabic-v2.012.zip',
  sha256: '65bceb5106ca17e8e0b4660bacec4d362afd56e0251e71fedf83f76dfe9f4abe',
  memberPath: 'NotoSansArabic/full/slim-variable-ttf/*.ttf',
};

const exists = async (path) =>
  access(path).then(
    () => true,
    () => false,
  );

await mkdir(fontDirectory, { recursive: true });

const fontPath = new URL(FONT.name, fontDirectory);

if (await exists(fontPath)) {
  console.log(`${FONT.name} est prête.`);
} else {
  const response = await fetch(FONT.url, { signal: AbortSignal.timeout(120_000) });

  if (!response.ok) {
    throw new Error(`Téléchargement impossible (${FONT.name}) : ${response.status} ${response.statusText}`);
  }

  const archive = Buffer.from(await response.arrayBuffer());
  const digest = createHash('sha256').update(archive).digest('hex');

  if (digest !== FONT.sha256) {
    throw new Error(`SHA-256 inattendu pour ${FONT.name} : ${digest}`);
  }

  const archivePath = new URL(`${FONT.name}.zip`, fontDirectory);
  await writeFile(archivePath, archive);
  const { stdout } = await run('unzip', ['-p', archivePath.pathname, FONT.memberPath], {
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
  });
  await writeFile(fontPath, stdout);
  await rm(archivePath);
  console.log(`Téléchargé et vérifié : ${FONT.name} (${stdout.length} o).`);
}
