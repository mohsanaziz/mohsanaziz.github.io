import type { LocaleCv } from './content.ts';
import * as en from './en.ts';
import * as fr from './fr.ts';
import type { Locale } from './locales.ts';
import type { LocaleMessages } from './messages.ts';

interface LocaleLayer {
  readonly messages: LocaleMessages;
  readonly cv: LocaleCv;
}

// The Arabic layer arrives with its own ticket, which will translate the interface and fall back to French
// key by key. Until then `/ar/` renders the French layer whole — interface included, not only the CV content.
const LOCALE_LAYERS = {
  fr,
  en,
  ar: fr,
} as const satisfies Record<Locale, LocaleLayer>;

// Deliberately the union of the layers' literal types rather than the schema: a message keeps its literal
// type through every lookup, which is what lets `formatMessage` check its placeholders at the call site.
export type Messages = (typeof LOCALE_LAYERS)[Locale]['messages'];

// The CV content, unlike the messages, is read through its schema: the merge needs completeness, not literals.
export function localeLayer(locale: Locale): { readonly messages: Messages; readonly cv: LocaleCv } {
  return LOCALE_LAYERS[locale];
}
