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
  readonly lineHeight: number;
  readonly printHeadingLineHeightFactor: number;
  readonly printBadgeLineHeightFactor: number;
}

const LOCALE_FORMATTING = {
  fr: {
    intlLocale: 'fr',
    numberingSystem: 'latn',
    lineHeight: 1.3,
    printHeadingLineHeightFactor: 1.05 / 1.3,
    printBadgeLineHeightFactor: 1.2 / 1.3,
  },
  en: {
    intlLocale: 'en',
    numberingSystem: 'latn',
    lineHeight: 1.3,
    printHeadingLineHeightFactor: 1.05 / 1.3,
    printBadgeLineHeightFactor: 1.2 / 1.3,
  },
  // Pin both choices instead of relying on the build machine's Arabic defaults.
  ar: {
    intlLocale: 'ar-u-ca-gregory-nu-arab',
    numberingSystem: 'arab',
    // Natural line box measured for the pinned Noto Sans Arabic v2.012 face.
    lineHeight: 2.112,
    printHeadingLineHeightFactor: 1,
    printBadgeLineHeightFactor: 1,
  },
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
