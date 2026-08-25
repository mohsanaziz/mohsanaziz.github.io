// Single declaration of the served locales: imported by astro.config.mjs and by the routes' getStaticPaths.
export const LOCALES = ['fr', 'en', 'ar'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE = 'fr' satisfies Locale;

// Locale-owned labels are invariant across the page displaying them and reusable outside the selector.
export const LOCALE_ENDONYMS = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
} as const satisfies Record<Locale, string>;

interface LocaleFormatting {
  readonly intlLocale: string;
  readonly numberingSystem: 'latn' | 'arab';
}

const LOCALE_FORMATTING = {
  fr: { intlLocale: 'fr', numberingSystem: 'latn' },
  en: { intlLocale: 'en', numberingSystem: 'latn' },
  // Pin both choices instead of relying on the build machine's Arabic defaults.
  ar: { intlLocale: 'ar-u-ca-gregory-nu-arab', numberingSystem: 'arab' },
} as const satisfies Record<Locale, LocaleFormatting>;

export function localeFormatting(locale: Locale): LocaleFormatting {
  return LOCALE_FORMATTING[locale];
}

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
