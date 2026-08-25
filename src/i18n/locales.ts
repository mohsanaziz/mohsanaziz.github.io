// Single declaration of the served locales: imported by astro.config.mjs and by the routes' getStaticPaths.
export const LOCALES = ['fr', 'en', 'ar'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE = 'fr' satisfies Locale;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

// Narrows Astro.currentLocale, which is typed as an arbitrary string, to a declared locale.
export function requireLocale(value: unknown): Locale {
  if (!isLocale(value)) {
    throw new Error(`Unknown locale: ${String(value)}.`);
  }

  return value;
}
