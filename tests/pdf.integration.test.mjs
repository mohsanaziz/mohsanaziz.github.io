import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { DEFAULT_LOCALE } from '../src/i18n/locales.ts';
import { resumeFileName, resumePath } from '../src/i18n/routing.ts';

const NOMINAL_LOCALES = [DEFAULT_LOCALE, 'en', 'ar'];
const PAGINATION_TEST_LOCALES = [DEFAULT_LOCALE, 'ar'];
const PACKAGE_PATH = new URL('../package.json', import.meta.url);
const A4_WIDTH_POINTS = 595.28;
const A4_HEIGHT_POINTS = 841.89;
const TIER_M_BODY_SIZE_POINTS = 6;
const MINIMUM_PAGINATION_TEST_MISSIONS = 12;
const EXPECTED_EMPLOYER_MISSION_FLOW = ['SASU AZMOPAK', 'ATLAS IHM', 'SPS', 'SIAJ', 'PARCOURS', 'IMS', 'Sopra Steria', 'PORTALIS V'];
const EXPECTED_MISSION_ENVIRONMENTS = [
  ['ATLAS IHM', 'Java, Spring Boot, Angular, RxJS, Ngrx, Bootstrap, npm, git, Docker, Kubernetes, Jenkins, Gitlab, Confluence, Jira'],
  [
    'SPS',
    'Java, Spring Boot, Hibernate, PostgreSQL, ElasticSearch, Zuul, Spring Batch, Spring Data JPA, Angular, Angular Material, RxJS, Bootstrap, npm, git, Docker, Docker Compose, Openshift, Jenkins, Gitlab, Nexus, Confluence, Jira',
  ],
  [
    'SIAJ',
    'Java, Spring Boot, Hibernate, PostgreSQL, Zuul, Spring Batch, Spring Data JPA, Angular, Angular Material, RxJS, Bootstrap, npm, git, Docker, Docker Compose, Openshift, Jenkins, Gitlab, Nexus, Confluence, Jira',
  ],
  [
    'PARCOURS',
    'Java, Spring Boot, Hibernate, PostgreSQL, Zuul, Spring Data JPA, Lombok, Angular, Angular Material, RxJS, npm, git, Docker, Docker Compose, Openshift, Jenkins, Gitlab, Nexus, Confluence, Jira',
  ],
  ['IMS', 'Java, Hibernate, PostgreSQL, Spring Data JPA, Angular, Angular Material, RxJS, npm, git, Bitbucket, Confluence, Jira'],
  [
    'PORTALIS V',
    'Java, Spring Boot, MyBatis, PostgreSQL, Zuul, Spring Batch, Angular, Angular Material, RxJS, Bootstrap, npm, git, Docker, Docker Compose, Openshift, Jenkins, Gitlab, Nexus, Confluence, Jira',
  ],
];
const TRANSLATED_NOMINAL_EXPECTATIONS = {
  fr: {
    bodySample: "Projet de refonte de l'application des magasins Point P",
    bodySizePoints: 6,
    footerPrefix: 'Généré depuis mohsanaziz.github.io · v',
    footerSuffix: ' — page',
    numPages: 1,
    title: 'Mohsan AZIZ — CV imprimable [M]',
    text: [
      'README.md',
      'Mohsan AZIZ',
      'Développeur freelance Angular/Java',
      'Paris, France',
      'Téléphone : 06.28.74.61.76',
      'Email : mohsan.aziz@gmail.com',
      'Date de naissance : 19 Octobre 1989',
      'GitHub : mohsanaziz',
      'LinkedIn : in/mohsanaziz',
      'A propos',
      'Expérience & projets client',
      'Freelance',
      'CDI',
      "Aujourd'hui",
      'Client : Saint-Gobain',
      'Client : Ministère de la Justice',
      'Environnement :',
      'application des magasins Point P',
      'système de gestion pénale',
      "système d'information de l'aide juridictionnelle",
      'logiciel de suivi des jeunes',
      'application de gestion des jeux à gratter',
      'logiciel des conseils de prud’hommes',
    ],
  },
  en: {
    bodySample: 'Redesign of the Point P in-store application',
    bodySizePoints: 6.9,
    footerPrefix: 'Generated from mohsanaziz.github.io · v',
    footerSuffix: ' — page',
    numPages: 1,
    title: 'Mohsan AZIZ — Printable CV [L]',
    text: [
      'README.md',
      'Mohsan AZIZ',
      'Freelance Angular/Java Developer',
      'Paris, France',
      'Phone: 06.28.74.61.76',
      'Email: mohsan.aziz@gmail.com',
      'Date of birth: 19 October 1989',
      'GitHub: mohsanaziz',
      'LinkedIn: in/mohsanaziz',
      'Profile',
      'Experience & client projects',
      'Freelance',
      'Permanent',
      'Present',
      'Client: Saint-Gobain',
      'Client: French Ministry of Justice',
      'Environment:',
      'Point P in-store application',
      'criminal case management system',
      'legal aid information system',
      'track young people',
      'scratch-card game management application',
      'French employment tribunals',
    ],
  },
};
const nominalPdfPromises = new Map();
const paginationTestPdfPromises = new Map();

async function readGeneratedPdf(pdfPath) {
  const bytes = await readFile(pdfPath);
  const loadingTask = getDocument({ data: new Uint8Array(bytes) });
  const document = await loadingTask.promise;

  return { bytes, document };
}

function readNominalPdf(locale) {
  if (!nominalPdfPromises.has(locale)) {
    nominalPdfPromises.set(locale, readGeneratedPdf(new URL(`../dist${resumePath(locale)}`, import.meta.url)));
  }

  return nominalPdfPromises.get(locale);
}

function readPaginationTestPdf(locale) {
  if (!paginationTestPdfPromises.has(locale)) {
    const pdfPath = new URL(`../tmp/pagination-test/${resumeFileName(locale)}`, import.meta.url);

    paginationTestPdfPromises.set(locale, readGeneratedPdf(pdfPath));
  }

  return paginationTestPdfPromises.get(locale);
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
  return Array.from(text.matchAll(/PAGINATION_TEST_(MISSION|EMPLOYER)_(START|END)_(\d+(?:_\d+)?)/g), ([marker, kind, boundary, id]) => ({
    marker,
    boundary: boundary.toLowerCase(),
    kind: kind.toLowerCase(),
    id: id.replace('_', '.'),
  }));
}

function paginationTestMarker(boundary, kind, id) {
  return `PAGINATION_TEST_${kind.toUpperCase()}_${boundary.toUpperCase()}_${id.replace('.', '_')}`;
}

function assertTextSequence(text, expectedSequence) {
  let cursor = 0;

  for (const expected of expectedSequence) {
    const index = text.indexOf(expected, cursor);
    assert.notEqual(index, -1, `Expected “${expected}” after the preceding CV entry.`);
    cursor = index + expected.length;
  }
}

for (const locale of PAGINATION_TEST_LOCALES) {
  test(`the inflated ${locale} CV paginates at the readable M tier`, async () => {
    const { document } = await readPaginationTestPdf(locale);

    assert.ok(document.numPages > 1, `Expected the inflated ${locale} CV to span multiple pages.`);
    assert.match((await document.getMetadata()).info.Title, /\[M\]$/);
    await assertDocumentTextSize(document, 'PAGINATION_TEST_MISSION_END', TIER_M_BODY_SIZE_POINTS);
  });

  test(`the inflated ${locale} CV keeps every mission intact and an employer banner with its first mission`, async () => {
    const { document } = await readPaginationTestPdf(locale);
    const pageTexts = await extractPageTexts(document);
    const markers = extractPaginationTestMarkers(pageTexts.join(' '));
    const missionTestIds = markers.filter(({ boundary, kind }) => boundary === 'start' && kind === 'mission').map(({ id }) => id);
    const employerTestIds = markers.filter(({ boundary, kind }) => boundary === 'start' && kind === 'employer').map(({ id }) => id);

    assert.ok(
      missionTestIds.length >= MINIMUM_PAGINATION_TEST_MISSIONS,
      `Expected the stress fixture to contain at least ${MINIMUM_PAGINATION_TEST_MISSIONS} missions.`,
    );
    assert.equal(new Set(missionTestIds).size, missionTestIds.length, 'Expected every stress-test mission marker to be unique.');

    for (const missionTestId of missionTestIds) {
      assert.equal(
        pageNumberContaining(pageTexts, paginationTestMarker('start', 'mission', missionTestId)),
        pageNumberContaining(pageTexts, paginationTestMarker('end', 'mission', missionTestId)),
        `Expected test mission ${missionTestId} to remain on one page.`,
      );
    }

    assert.ok(employerTestIds.length > 0, 'Expected the stress fixture to contain employer banners.');

    for (const employerTestId of employerTestIds) {
      const employerPage = pageNumberContaining(pageTexts, paginationTestMarker('start', 'employer', employerTestId));

      assert.equal(employerPage, pageNumberContaining(pageTexts, paginationTestMarker('end', 'employer', employerTestId)));
      assert.equal(employerPage, pageNumberContaining(pageTexts, paginationTestMarker('start', 'mission', `${employerTestId}.1`)));
    }

    assert.ok(
      employerTestIds.some((employerTestId) => {
        const missionPages = missionTestIds
          .filter((missionTestId) => missionTestId.startsWith(`${employerTestId}.`))
          .map((missionTestId) => pageNumberContaining(pageTexts, paginationTestMarker('start', 'mission', missionTestId)));

        return new Set(missionPages).size > 1;
      }),
      'Expected the stress fixture to force a page break inside an employer group.',
    );
  });

  test(`the inflated ${locale} CV carries exact page numbers and a linear reading flow across pages`, async () => {
    const { document } = await readPaginationTestPdf(locale);
    const pageTexts = await extractPageTexts(document);

    for (const [pageIndex, pageText] of pageTexts.entries()) {
      assert.ok(pageText.includes('mohsanaziz.github.io'), `Expected page ${pageIndex + 1} to carry its source footer.`);
      assert.match(pageText, new RegExp(`\\b${pageIndex + 1}/${pageTexts.length}\\b`));
    }

    const markers = extractPaginationTestMarkers(pageTexts.join(' '));

    assert.ok(markers.length >= 2 * MINIMUM_PAGINATION_TEST_MISSIONS, 'Expected markers throughout the inflated reading flow.');

    for (let markerIndex = 0; markerIndex < markers.length; markerIndex += 2) {
      const start = markers[markerIndex];
      const end = markers[markerIndex + 1];

      assert.equal(start.boundary, 'start', `Expected marker ${markerIndex + 1} to start a printable block.`);
      assert.deepEqual(
        end,
        { ...start, marker: paginationTestMarker('end', start.kind, start.id), boundary: 'end' },
        `Expected ${start.kind} ${start.id} to end before the next printable block.`,
      );
    }
  });
}

for (const locale of NOMINAL_LOCALES) {
  test(`the nominal ${locale} artifact is a valid A4 PDF with a coherent footer and typography tier`, async () => {
    const { bytes, document } = await readNominalPdf(locale);
    const pageTexts = await extractPageTexts(document);

    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.match((await document.getMetadata()).info.Title, /\[(?:XL|L|M)\]$/);

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const viewport = (await document.getPage(pageNumber)).getViewport({ scale: 1 });
      const pageText = pageTexts[pageNumber - 1];

      assert.ok(Math.abs(viewport.width - A4_WIDTH_POINTS) < 0.5);
      assert.ok(Math.abs(viewport.height - A4_HEIGHT_POINTS) < 0.5);
      assert.ok(pageText.includes('mohsanaziz.github.io'), `Expected ${locale} page ${pageNumber} to carry its source footer.`);
      assert.match(pageText, new RegExp(`\\b${pageNumber}/${document.numPages}\\b`));
    }

    assert.doesNotMatch(pageTexts.join(' '), /PAGINATION_TEST_/);
  });

  test(`the nominal ${locale} artifact preserves the invariant employer and technology flow`, async () => {
    const { document } = await readNominalPdf(locale);
    const text = (await extractDocumentText(document))
      .replace(/[^\x20-\x7e]/g, ' ')
      .replace(/\s*:\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    assertTextSequence(text, EXPECTED_EMPLOYER_MISSION_FLOW);
    assertTextSequence(text, EXPECTED_MISSION_ENVIRONMENTS.flat());
  });
}

for (const [locale, expectations] of Object.entries(TRANSLATED_NOMINAL_EXPECTATIONS)) {
  test(`the nominal ${locale} artifact carries its explicit pagination, tier and translated content`, async () => {
    const [{ document }, packageMetadata] = await Promise.all([readNominalPdf(locale), readFile(PACKAGE_PATH, 'utf8').then(JSON.parse)]);
    const pageTexts = await extractPageTexts(document);
    const text = pageTexts.join(' ');

    assert.equal(document.numPages, expectations.numPages);
    assert.equal((await document.getMetadata()).info.Title, expectations.title);
    await assertDocumentTextSize(document, expectations.bodySample, expectations.bodySizePoints);

    for (const pageText of pageTexts) {
      assert.ok(pageText.includes(`${expectations.footerPrefix}${packageMetadata.version}${expectations.footerSuffix}`));
    }

    for (const expected of expectations.text) {
      assert.ok(text.includes(expected), `Expected the ${locale} PDF text to contain “${expected}”.`);
    }
  });
}
