import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const PDF_PATH = new URL('../dist/cv/CV.pdf', import.meta.url);
const PAGINATION_TEST_PDF_PATH = new URL('../dist/cv/CV.pagination-test.pdf', import.meta.url);
const PACKAGE_PATH = new URL('../package.json', import.meta.url);
const A4_WIDTH_POINTS = 595.28;
const A4_HEIGHT_POINTS = 841.89;
const TIER_M_BODY_SIZE_POINTS = 6;
const TIER_M_PDF_TITLE = 'Mohsan AZIZ — CV imprimable — palier M';

async function readGeneratedPdf(pdfPath = PDF_PATH) {
  const bytes = await readFile(pdfPath);
  const loadingTask = getDocument({ data: new Uint8Array(bytes) });
  const document = await loadingTask.promise;

  return { bytes, document };
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

function pageNumberContaining(pageTexts, expected) {
  const pageIndex = pageTexts.findIndex((text) => text.includes(expected));

  assert.notEqual(pageIndex, -1, `Expected a PDF page to contain “${expected}”.`);

  return pageIndex + 1;
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
  const { document } = await readGeneratedPdf(PAGINATION_TEST_PDF_PATH);

  assert.ok(document.numPages > 1, 'Expected the inflated CV to span multiple pages.');
  assert.equal((await document.getMetadata()).info.Title, TIER_M_PDF_TITLE);
});

test('the inflated CV keeps every mission intact and an employer banner with its first mission', async () => {
  const { document } = await readGeneratedPdf(PAGINATION_TEST_PDF_PATH);
  const pageTexts = await extractPageTexts(document);
  const missionTestIds = ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '1.10', '2.1', '2.2'];

  for (const missionTestId of missionTestIds) {
    assert.equal(
      pageNumberContaining(pageTexts, `test pagination ${missionTestId}`),
      pageNumberContaining(pageTexts, `fin test pagination ${missionTestId}`),
      `Expected test mission ${missionTestId} to remain on one page.`,
    );
  }

  assert.notEqual(
    pageNumberContaining(pageTexts, 'test pagination 1.1'),
    pageNumberContaining(pageTexts, 'test pagination 1.10'),
    'Expected the stress fixture to force a page break inside an employer group.',
  );
  assert.equal(
    pageNumberContaining(pageTexts, 'SASU AZMOPAK — test pagination 1'),
    pageNumberContaining(pageTexts, 'fin test pagination employeur 1'),
  );
  assert.equal(
    pageNumberContaining(pageTexts, 'SASU AZMOPAK — test pagination 1'),
    pageNumberContaining(pageTexts, 'ATLAS IHM — test pagination 1.1'),
  );
  assert.equal(
    pageNumberContaining(pageTexts, 'Sopra Steria — test pagination 2'),
    pageNumberContaining(pageTexts, 'fin test pagination employeur 2'),
  );
  assert.equal(
    pageNumberContaining(pageTexts, 'Sopra Steria — test pagination 2'),
    pageNumberContaining(pageTexts, 'PORTALIS V3 — test pagination 2.1'),
  );
});

test('the inflated CV carries exact footers and a linear reading flow across pages', async () => {
  const [{ document }, packageMetadata] = await Promise.all([
    readGeneratedPdf(PAGINATION_TEST_PDF_PATH),
    readFile(PACKAGE_PATH, 'utf8').then(JSON.parse),
  ]);
  const pageTexts = await extractPageTexts(document);

  for (const [pageIndex, pageText] of pageTexts.entries()) {
    assert.match(
      pageText,
      new RegExp(`Généré depuis mohsanaziz\\.github\\.io · v${packageMetadata.version} — page ${pageIndex + 1}/${pageTexts.length}`),
    );
  }

  assertTextSequence(pageTexts.join(' '), [
    'SASU AZMOPAK — test pagination 1',
    'ATLAS IHM — test pagination 1.1',
    'fin test pagination 1.1',
    'SPS — test pagination 1.2',
    'fin test pagination 1.2',
    'SIAJ — test pagination 1.3',
    'fin test pagination 1.3',
    'PARCOURS — test pagination 1.4',
    'fin test pagination 1.4',
    'IMS — test pagination 1.5',
    'fin test pagination 1.5',
    'ATLAS IHM — test pagination 1.6',
    'fin test pagination 1.6',
    'SPS — test pagination 1.7',
    'fin test pagination 1.7',
    'SIAJ — test pagination 1.8',
    'fin test pagination 1.8',
    'PARCOURS — test pagination 1.9',
    'fin test pagination 1.9',
    'IMS — test pagination 1.10',
    'fin test pagination 1.10',
    'Sopra Steria — test pagination 2',
    'PORTALIS V3 — test pagination 2.1',
    'fin test pagination 2.1',
    'PORTALIS V3 — test pagination 2.2',
    'fin test pagination 2.2',
  ]);
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

  const { items } = await page.getTextContent();
  const bodyText = items.find((item) => 'str' in item && item.str.includes("Projet de refonte de l'application des magasins Point P"));
  assert.ok(bodyText && 'transform' in bodyText, 'Expected representative body copy in the PDF text layer.');
  assert.ok(Math.abs(Math.hypot(bodyText.transform[2], bodyText.transform[3]) - TIER_M_BODY_SIZE_POINTS) < 0.05);

  const text = await extractPageText(page);
  assert.match(text, new RegExp(`Généré depuis mohsanaziz\\.github\\.io · v${packageMetadata.version} — page 1/1`));
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
