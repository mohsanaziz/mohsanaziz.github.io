import type { LocaleCv } from './content.ts';
import * as en from './en.ts';
import * as fr from './fr.ts';
import type { Locale } from './locales.ts';
import type { LocaleMessages } from './messages.ts';

interface LocaleLayer {
  readonly messages: LocaleMessages;
  readonly cv: LocaleCv;
}

type LocaleContentCoverage = 'complete' | 'interface-only';

interface LocaleLayerDefinition {
  readonly layer: LocaleLayer;
  readonly contentCoverage: LocaleContentCoverage;
}

// The definition keeps the rendered layer and its coverage together. Ticket #76 will give Arabic its own
// partial layer while leaving `contentCoverage` unchanged until the CV content itself is translated.
const LOCALE_LAYERS = {
  fr: { layer: fr, contentCoverage: 'complete' },
  en: { layer: en, contentCoverage: 'complete' },
  // Until #76, `/ar/` renders the French layer whole — interface included, not only the CV content.
  ar: { layer: fr, contentCoverage: 'interface-only' },
} as const satisfies Record<Locale, LocaleLayerDefinition>;

// Deliberately the union of the layers' literal types rather than the schema: a message keeps its literal
// type through every lookup, which is what lets `formatMessage` check its placeholders at the call site.
export type Messages = (typeof LOCALE_LAYERS)[Locale]['layer']['messages'];

// The CV content, unlike the messages, is read through its schema: the merge needs completeness, not literals.
export function localeLayer(locale: Locale): { readonly messages: Messages; readonly cv: LocaleCv } {
  return LOCALE_LAYERS[locale].layer;
}

export function localeContentCoverage(locale: Locale): LocaleContentCoverage {
  return LOCALE_LAYERS[locale].contentCoverage;
}
