import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { localePagePath, openGraphImagePath } from '../src/i18n/routing.ts';

const OPEN_GRAPH_CARD_SIZE = { width: 1200, height: 630 };

function generationTarget(buildDirectory, locale) {
  return {
    locale,
    pagePath: localePagePath(locale, 'og-card'),
    imagePath: join(buildDirectory, openGraphImagePath(locale)),
  };
}

async function generateOpenGraphImage(context, buildServer, { locale, pagePath, imagePath }) {
  const page = await context.newPage();
  const loadingErrors = [];

  try {
    await page.setViewportSize(OPEN_GRAPH_CARD_SIZE);
    page.on('requestfailed', (request) => loadingErrors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', (response) => {
      if (response.status() >= 400) {
        loadingErrors.push(`${response.request().method()} ${response.url()}: HTTP ${response.status()}`);
      }
    });

    const response = await page.goto(`${buildServer.origin}${pagePath}`, { waitUntil: 'networkidle' });

    if (!response?.ok()) {
      throw new Error(`The Open Graph card for locale "${locale}" returned HTTP ${response?.status() ?? 'unknown'}.`);
    }

    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    if (loadingErrors.length > 0) {
      throw new Error(`The Open Graph card for locale "${locale}" did not load completely:\n${loadingErrors.join('\n')}`);
    }

    const cardSize = await page.locator('main').evaluate((card) => {
      const { width, height } = card.getBoundingClientRect();

      return { width, height };
    });

    if (cardSize.width !== OPEN_GRAPH_CARD_SIZE.width || cardSize.height !== OPEN_GRAPH_CARD_SIZE.height) {
      throw new Error(
        `The Open Graph card for locale "${locale}" must be ${OPEN_GRAPH_CARD_SIZE.width}×${OPEN_GRAPH_CARD_SIZE.height}, got ${cardSize.width}×${cardSize.height}.`,
      );
    }

    await mkdir(dirname(imagePath), { recursive: true });
    await page.screenshot({ path: imagePath, type: 'png', clip: { x: 0, y: 0, ...OPEN_GRAPH_CARD_SIZE } });
  } finally {
    await page.close();
  }
}

export async function generateOpenGraphImages(context, buildServer, buildDirectory, locales) {
  for (const locale of locales) {
    const target = generationTarget(buildDirectory, locale);

    await generateOpenGraphImage(context, buildServer, target);
    console.log(`Generated ${target.imagePath}`);
  }
}
