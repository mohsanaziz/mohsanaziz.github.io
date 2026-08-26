import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { localePagePath, openGraphImagePath } from '../src/i18n/routing.ts';
import { withLoadedBuildPage } from './capture-build-page.mjs';

const OPEN_GRAPH_CARD_SIZE = { width: 1200, height: 630 };

function generationTarget(buildDirectory, locale) {
  return {
    locale,
    pagePath: localePagePath(locale, 'og-card'),
    imagePath: join(buildDirectory, openGraphImagePath(locale)),
  };
}

async function generateOpenGraphImage(context, buildServer, { locale, pagePath, imagePath }) {
  await withLoadedBuildPage(
    context,
    buildServer,
    { label: `The Open Graph card for locale "${locale}"`, pagePath, viewport: OPEN_GRAPH_CARD_SIZE },
    async (page) => {
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
    },
  );
}

export async function generateOpenGraphImages(context, buildServer, buildDirectory, locales) {
  for (const locale of locales) {
    const target = generationTarget(buildDirectory, locale);

    await generateOpenGraphImage(context, buildServer, target);
    console.log(`Generated ${target.imagePath}`);
  }
}
