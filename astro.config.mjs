import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import { DEFAULT_LOCALE, LOCALES } from './src/i18n/locales.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://mohsanaziz.github.io',
  // The pages are produced by the `[...locale]` rest routes; this block only provides
  // Astro.currentLocale and the locale URL helpers, which absorb the unprefixed default locale.
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: [...LOCALES],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
