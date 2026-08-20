import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const PDF_PATH = new URL('../dist/cv/CV.pdf', import.meta.url);
const PACKAGE_PATH = new URL('../package.json', import.meta.url);
const A4_WIDTH_POINTS = 595.28;
const A4_HEIGHT_POINTS = 841.89;
const TIER_M_BODY_SIZE_POINTS = 6;

async function readGeneratedPdf() {
  const bytes = await readFile(PDF_PATH);
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
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    pageTexts.push(await extractPageText(await document.getPage(pageNumber)));
  }

  return pageTexts.join(' ');
}

function assertTextSequence(text, expectedSequence) {
  let cursor = 0;

  for (const expected of expectedSequence) {
    const index = text.indexOf(expected, cursor);
    assert.notEqual(index, -1, `Expected “${expected}” after the preceding CV entry.`);
    cursor = index + expected.length;
  }
}

test('the current CV uses the readable M tier on one A4 page carrying its source version', async () => {
  const [{ bytes, document }, packageMetadata] = await Promise.all([readGeneratedPdf(), readFile(PACKAGE_PATH, 'utf8').then(JSON.parse)]);

  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  assert.equal(document.numPages, 1);

  const page = await document.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  assert.ok(Math.abs(viewport.width - A4_WIDTH_POINTS) < 0.5);
  assert.ok(Math.abs(viewport.height - A4_HEIGHT_POINTS) < 0.5);

  const { items } = await page.getTextContent();
  const bodyText = items.find((item) => 'str' in item && item.str === 'ATLAS IHM');
  assert.ok(bodyText && 'transform' in bodyText, 'Expected a representative mission title in the PDF text layer.');
  assert.ok(Math.abs(Math.hypot(bodyText.transform[2], bodyText.transform[3]) - TIER_M_BODY_SIZE_POINTS) < 0.05);

  const text = await extractPageText(page);
  assert.match(text, new RegExp(`Généré depuis mohsanaziz\\.github\\.io · v${packageMetadata.version} — page 1/1`));
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
