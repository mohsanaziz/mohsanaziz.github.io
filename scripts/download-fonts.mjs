import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const fonts = [
  {
    family: 'Noto Sans Arabic',
    version: '2.012',
    subset: 'latin',
    fileName: 'NotoSansArabic-latin.woff2',
    url: 'https://fonts.gstatic.com/s/notosansarabic/v33/nwpCtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlj41v4rqxzLI.woff2',
    expectedSha256: '20d51311e187e0ff5be9d6fe24f099e97be6cc583078d6f271c74d68920cd1e0',
  },
  {
    family: 'Noto Sans Arabic',
    version: '2.012',
    subset: 'arabic',
    fileName: 'NotoSansArabic-arabic.woff2',
    url: 'https://fonts.gstatic.com/s/notosansarabic/v33/nwpCtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlj4wv4rqxzLIhjE.woff2',
    expectedSha256: '69cdf0bf005fdc9cc13fb5a8581697eb9ba8f761aeaf255fc717d14c62c38891',
  },
  {
    family: 'Noto Sans Mono',
    version: '2.014',
    subset: 'latin',
    fileName: 'NotoSansMono-latin.woff2',
    url: 'https://fonts.gstatic.com/s/notosansmono/v37/BngcUXNETWXI6LwhGYvaxZikqZqK6fBq6kPvUce2oAZ2evCj.woff2',
    expectedSha256: '71f6c22d5dd256eaa9e48347bda6ac2c65f58980dd372ed5780fbdaca1186331',
  },
];

const fontDirectory = fileURLToPath(new URL('../public/fonts/', import.meta.url));

export const sha256 = (contents) => createHash('sha256').update(contents).digest('hex');

const describeFont = ({ family, version, subset }) => `${family} v${version} ${subset} subset`;

export async function provisionFont(font, { directory = fontDirectory, fetchFont = fetch } = {}) {
  const destination = join(directory, font.fileName);
  const description = describeFont(font);

  try {
    const currentFont = await readFile(destination);

    if (sha256(currentFont) === font.expectedSha256) {
      console.log(`${description} is ready.`);
      return;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const response = await fetchFont(font.url, { signal: AbortSignal.timeout(30_000) });

  if (!response.ok) {
    throw new Error(`Unable to download ${description}: ${response.status} ${response.statusText}`);
  }

  const downloadedFont = Buffer.from(await response.arrayBuffer());
  const downloadedSha256 = sha256(downloadedFont);

  if (downloadedSha256 !== font.expectedSha256) {
    throw new Error(`Unexpected ${description} SHA-256: ${downloadedSha256} (expected ${font.expectedSha256})`);
  }

  await mkdir(directory, { recursive: true });
  await writeFile(destination, downloadedFont);
  console.log(`Downloaded and verified ${description}.`);
}

export async function provisionFonts() {
  // Migration cleanup for #72: Astro would otherwise publish a generated predecessor left by an earlier build.
  await rm(join(fontDirectory, 'Satoshi.woff2'), { force: true });
  await Promise.all(fonts.map((font) => provisionFont(font)));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  await provisionFonts();
}
