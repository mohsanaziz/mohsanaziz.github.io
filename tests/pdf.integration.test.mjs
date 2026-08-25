import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { DEFAULT_LOCALE } from '../src/i18n/locales.ts';
import { resumeFileName, resumePath } from '../src/i18n/routing.ts';

const PDF_PATH = new URL(`../dist${resumePath(DEFAULT_LOCALE)}`, import.meta.url);
const PAGINATION_TEST_PDF_PATH = new URL(`../tmp/pagination-test/${resumeFileName(DEFAULT_LOCALE)}`, import.meta.url);
const PACKAGE_PATH = new URL('../package.json', import.meta.url);
const A4_WIDTH_POINTS = 595.28;
const A4_HEIGHT_POINTS = 841.89;
const TIER_M_BODY_SIZE_POINTS = 6;
const TIER_M_PDF_TITLE = 'Mohsan AZIZ — CV imprimable — palier M';
const MINIMUM_PAGINATION_TEST_MISSIONS = 12;
let paginationTestPdfPromise;

async function readGeneratedPdf(pdfPath = PDF_PATH) {
  const bytes = await readFile(pdfPath);
  const loadingTask = getDocument({ data: new Uint8Array(bytes) });
  const document = await loadingTask.promise;

  return { bytes, document };
}

function readPaginationTestPdf() {
  paginationTestPdfPromise ??= readGeneratedPdf(PAGINATION_TEST_PDF_PATH);

  return paginationTestPdfPromise;
}

async function extractPageText(page) {
  const { items } = await page.getTextContent();

  return items
    .filter((item) => 'str' in item)
    .map((item) => item.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractDocumentText(document) {
  return (await extractPageTexts(document)).join(' ');
}

async function extractPageTexts(document) {
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    pageTexts.push(await extractPageText(await document.getPage(pageNumber)));
  }

  return pageTexts;
}

async function assertDocumentTextSize(document, expectedText, expectedSizePoints) {
  let textItem;

  for (let pageNumber = 1; pageNumber <= document.numPages && !textItem; pageNumber += 1) {
    const { items } = await (await document.getPage(pageNumber)).getTextContent();
    textItem = items.find((item) => 'str' in item && item.str.includes(expectedText));
  }

  assert.ok(textItem && 'transform' in textItem, `Expected PDF text containing “${expectedText}” in the text layer.`);
  assert.ok(Math.abs(Math.hypot(textItem.transform[2], textItem.transform[3]) - expectedSizePoints) < 0.05);
}

function pageNumberContaining(pageTexts, expected) {
  const pageIndex = pageTexts.findIndex((text) => text.includes(expected));

  assert.notEqual(pageIndex, -1, `Expected a PDF page to contain “${expected}”.`);

  return pageIndex + 1;
}

function extractPaginationTestMarkers(text) {
  return Array.from(
    text.matchAll(/\[(début|fin) test pagination (mission|employeur) (\d+(?:\.\d+)?)\]/g),
    ([marker, boundary, kind, id]) => ({ marker, boundary, kind, id }),
  );
}

function paginationTestMarker(boundary, kind, id) {
  return `[${boundary} test pagination ${kind} ${id}]`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertTextSequence(text, expectedSequence) {
  let cursor = 0;

  for (const expected of expectedSequence) {
    const index = text.indexOf(expected, cursor);
    assert.notEqual(index, -1, `Expected “${expected}” after the preceding CV entry.`);
    cursor = index + expected.length;
  }
}

test('the inflated CV paginates at the readable M tier', async () => {
  const { document } = await readPaginationTestPdf();

  assert.ok(document.numPages > 1, 'Expected the inflated CV to span multiple pages.');
  assert.equal((await document.getMetadata()).info.Title, TIER_M_PDF_TITLE);
  await assertDocumentTextSize(document, '[fin test pagination mission', TIER_M_BODY_SIZE_POINTS);
});

test('the inflated CV keeps every mission intact and an employer banner with its first mission', async () => {
  const { document } = await readPaginationTestPdf();
  const pageTexts = await extractPageTexts(document);
  const markers = extractPaginationTestMarkers(pageTexts.join(' '));
  const missionTestIds = markers.filter(({ boundary, kind }) => boundary === 'début' && kind === 'mission').map(({ id }) => id);
  const employerTestIds = markers.filter(({ boundary, kind }) => boundary === 'début' && kind === 'employeur').map(({ id }) => id);

  assert.ok(
    missionTestIds.length >= MINIMUM_PAGINATION_TEST_MISSIONS,
    `Expected the stress fixture to contain at least ${MINIMUM_PAGINATION_TEST_MISSIONS} missions.`,
  );
  assert.equal(new Set(missionTestIds).size, missionTestIds.length, 'Expected every stress-test mission marker to be unique.');

  for (const missionTestId of missionTestIds) {
    assert.equal(
      pageNumberContaining(pageTexts, paginationTestMarker('début', 'mission', missionTestId)),
      pageNumberContaining(pageTexts, paginationTestMarker('fin', 'mission', missionTestId)),
      `Expected test mission ${missionTestId} to remain on one page.`,
    );
  }

  assert.ok(employerTestIds.length > 0, 'Expected the stress fixture to contain employer banners.');

  for (const employerTestId of employerTestIds) {
    const employerPage = pageNumberContaining(pageTexts, paginationTestMarker('début', 'employeur', employerTestId));

    assert.equal(employerPage, pageNumberContaining(pageTexts, paginationTestMarker('fin', 'employeur', employerTestId)));
    assert.equal(employerPage, pageNumberContaining(pageTexts, paginationTestMarker('début', 'mission', `${employerTestId}.1`)));
  }

  assert.ok(
    employerTestIds.some((employerTestId) => {
      const missionPages = missionTestIds
        .filter((missionTestId) => missionTestId.startsWith(`${employerTestId}.`))
        .map((missionTestId) => pageNumberContaining(pageTexts, paginationTestMarker('début', 'mission', missionTestId)));

      return new Set(missionPages).size > 1;
    }),
    'Expected the stress fixture to force a page break inside an employer group.',
  );
});

test('the inflated CV carries exact footers and a linear reading flow across pages', async () => {
  const [{ document }, packageMetadata] = await Promise.all([readPaginationTestPdf(), readFile(PACKAGE_PATH, 'utf8').then(JSON.parse)]);
  const pageTexts = await extractPageTexts(document);
  const packageVersionPattern = escapeRegExp(packageMetadata.version);

  for (const [pageIndex, pageText] of pageTexts.entries()) {
    assert.match(
      pageText,
      new RegExp(`Généré depuis mohsanaziz\\.github\\.io · v${packageVersionPattern} — page ${pageIndex + 1}/${pageTexts.length}`),
    );
  }

  const markers = extractPaginationTestMarkers(pageTexts.join(' '));

  assert.ok(markers.length >= 2 * MINIMUM_PAGINATION_TEST_MISSIONS, 'Expected markers throughout the inflated reading flow.');

  for (let markerIndex = 0; markerIndex < markers.length; markerIndex += 2) {
    const start = markers[markerIndex];
    const end = markers[markerIndex + 1];

    assert.equal(start.boundary, 'début', `Expected marker ${markerIndex + 1} to start a printable block.`);
    assert.deepEqual(
      end,
      { ...start, marker: paginationTestMarker('fin', start.kind, start.id), boundary: 'fin' },
      `Expected ${start.kind} ${start.id} to end before the next printable block.`,
    );
  }
});

test('the current CV reports the readable M tier on one A4 page carrying its source version', async () => {
  const [{ bytes, document }, packageMetadata] = await Promise.all([readGeneratedPdf(), readFile(PACKAGE_PATH, 'utf8').then(JSON.parse)]);

  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  assert.equal(document.numPages, 1);
  assert.equal((await document.getMetadata()).info.Title, TIER_M_PDF_TITLE);

  const page = await document.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  assert.ok(Math.abs(viewport.width - A4_WIDTH_POINTS) < 0.5);
  assert.ok(Math.abs(viewport.height - A4_HEIGHT_POINTS) < 0.5);

  await assertDocumentTextSize(document, "Projet de refonte de l'application des magasins Point P", TIER_M_BODY_SIZE_POINTS);

  const text = await extractPageText(page);
  assert.match(text, new RegExp(`Généré depuis mohsanaziz\\.github\\.io · v${escapeRegExp(packageMetadata.version)} — page 1/1`));
  assert.doesNotMatch(text, /test pagination/);
});

test('the generated PDF exposes the profile, contact details and section titles as text', async () => {
  const { document } = await readGeneratedPdf();
  const text = await extractDocumentText(document);
  const expectedText = [
    'README.md',
    'Mohsan AZIZ',
    'Développeur freelance Angular/Java',
    'Paris, France',
    '06.28.74.61.76',
    'mohsan.aziz@gmail.com',
    'mohsanaziz',
    'in/mohsanaziz',
    'A propos',
    'Expérience & projets client',
  ];

  for (const expected of expectedText) {
    assert.ok(text.includes(expected), `Expected the PDF text to contain “${expected}”.`);
  }
});

test('the current employers precede their missions in the generated PDF reading flow', async () => {
  const { document } = await readGeneratedPdf();
  const text = await extractDocumentText(document);

  assertTextSequence(text, ['SASU AZMOPAK', 'ATLAS IHM', 'SPS', 'SIAJ', 'PARCOURS', 'IMS', 'Sopra Steria', 'PORTALIS V3']);
});

test('each current mission environment is fully extractable from the generated PDF', async () => {
  const { document } = await readGeneratedPdf();
  const text = await extractDocumentText(document);
  const expectedMissionEnvironments = [
    [
      'ATLAS IHM',
      'Environnement : Java, Spring Boot, Angular, RxJS, Ngrx, Bootstrap, npm, git, Docker, Kubernetes, Jenkins, Gitlab, Confluence, Jira',
    ],
    [
      'SPS',
      'Environnement : Java, Spring Boot, Hibernate, PostgreSQL, ElasticSearch, Zuul, Spring Batch, Spring Data JPA, Angular, Angular Material, RxJS, Bootstrap, npm, git, Docker, Docker Compose, Openshift, Jenkins, Gitlab, Nexus, Confluence, Jira',
    ],
    [
      'SIAJ',
      'Environnement : Java, Spring Boot, Hibernate, PostgreSQL, Zuul, Spring Batch, Spring Data JPA, Angular, Angular Material, RxJS, Bootstrap, npm, git, Docker, Docker Compose, Openshift, Jenkins, Gitlab, Nexus, Confluence, Jira',
    ],
    [
      'PARCOURS',
      'Environnement : Java, Spring Boot, Hibernate, PostgreSQL, Zuul, Spring Data JPA, Lombok, Angular, Angular Material, RxJS, npm, git, Docker, Docker Compose, Openshift, Jenkins, Gitlab, Nexus, Confluence, Jira',
    ],
    [
      'IMS',
      'Environnement : Java, Hibernate, PostgreSQL, Spring Data JPA, Angular, Angular Material, RxJS, npm, git, Bitbucket, Confluence, Jira',
    ],
    [
      'PORTALIS V3',
      'Environnement : Java, Spring Boot, MyBatis, PostgreSQL, Zuul, Spring Batch, Angular, Angular Material, RxJS, Bootstrap, npm, git, Docker, Docker Compose, Openshift, Jenkins, Gitlab, Nexus, Confluence, Jira',
    ],
  ];

  assertTextSequence(text, expectedMissionEnvironments.flat());
});
