import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const fontUrl =
  'https://cdn.fontshare.com/wf/NWBQYJIM7GCZ5XWD7D26ARB3VDY55ZRT/K63EV2KZIGKLE7RANQ2U42S6SVHU5RJ7/X6XYTKIVDUW7GZTZPZNN4EUM5KH54KHF.woff2';
const fontDirectory = new URL('../public/fonts/', import.meta.url);
const fontPath = new URL('Satoshi.woff2', fontDirectory);
const expectedSha256 = 'e739aff9b4d02c264341d6d4872edcda28e79373aeda936f659566a1cd3eb47f';

const sha256 = (contents) => createHash('sha256').update(contents).digest('hex');

try {
  const currentFont = await readFile(fontPath);

  if (sha256(currentFont) === expectedSha256) {
    console.log('Satoshi variable font is ready.');
    process.exit(0);
  }
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}

const response = await fetch(fontUrl, { signal: AbortSignal.timeout(30_000) });

if (!response.ok) {
  throw new Error(`Unable to download Satoshi: ${response.status} ${response.statusText}`);
}

const downloadedFont = Buffer.from(await response.arrayBuffer());
const downloadedSha256 = sha256(downloadedFont);

if (downloadedSha256 !== expectedSha256) {
  throw new Error(`Unexpected Satoshi SHA-256: ${downloadedSha256}`);
}

await mkdir(fontDirectory, { recursive: true });
await writeFile(fontPath, downloadedFont);
console.log('Downloaded and verified the Satoshi variable font.');
