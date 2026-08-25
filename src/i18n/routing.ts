import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales.ts';

export type Direction = 'ltr' | 'rtl';

const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['ar']);

// The default locale lives at the site root: its URL carries no locale segment.
export function localeUrlSegment(locale: Locale): Locale | undefined {
  return locale === DEFAULT_LOCALE ? undefined : locale;
}

// Static paths for the `[...locale]` rest routes: one page per locale, `undefined` for the root.
export function localeStaticPaths(): { params: { locale: Locale | undefined } }[] {
  return LOCALES.map((locale) => ({ params: { locale: localeUrlSegment(locale) } }));
}

export function localeDirection(locale: Locale): Direction {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

// The generated PDFs stay grouped under /cv/; the locale will distinguish the file name (see ADR 0007 §6).
// Until the multilingual PDF ticket lands, every locale still points at the French artefact.
export function resumeFileName(_locale: Locale): string {
  return 'CV.pdf';
}

export function resumePath(locale: Locale): string {
  return `/cv/${resumeFileName(locale)}`;
}
