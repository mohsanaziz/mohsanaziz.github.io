import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales.ts';

export type Direction = 'ltr' | 'rtl';

const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['ar']);

// The default locale lives at the site root: its URL carries no locale segment.
export function localeUrlSegment(locale: Locale): Locale | undefined {
  return locale === DEFAULT_LOCALE ? undefined : locale;
}

export function localeRoutes(): readonly { locale: Locale; urlSegment: Locale | undefined }[] {
  return LOCALES.map((locale) => ({ locale, urlSegment: localeUrlSegment(locale) }));
}

// Static paths for the `[...locale]` rest routes: one page per locale, `undefined` for the root.
export function localeStaticPaths(): { params: { locale: Locale | undefined } }[] {
  return localeRoutes().map(({ urlSegment }) => ({ params: { locale: urlSegment } }));
}

export function localeDirection(locale: Locale): Direction {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

// The generated PDFs stay grouped under /cv/. French keeps the historical URL while every prefixed locale
// reuses its ASCII URL token as the download suffix (see ADR 0007 §6).
export function resumeFileName(locale: Locale): string {
  const suffix = localeUrlSegment(locale);

  return `CV${suffix === undefined ? '' : `-${suffix}`}.pdf`;
}

export function resumePath(locale: Locale): string {
  return `/cv/${resumeFileName(locale)}`;
}
