import type { LocaleCv } from './content.ts';
import * as ar from './ar.ts';
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

// The definition keeps the rendered layer and its coverage together. Every layer is typed complete, so a
// core entry added without one of its translations fails `astro check`; `interface-only` remains available
// for a future locale wired before its CV content is translated (see ADR 0007 §2).
const LOCALE_LAYERS = {
  fr: { layer: fr, contentCoverage: 'complete' },
  en: { layer: en, contentCoverage: 'complete' },
  ar: { layer: ar, contentCoverage: 'complete' },
} as const satisfies Record<Locale, LocaleLayerDefinition>;

// Deliberately the union of the layers' literal types rather than the schema: a message keeps its literal
// type through every lookup, which is what lets `formatMessage` check its placeholders at the call site.
export type Messages = (typeof LOCALE_LAYERS)[Locale]['layer']['messages'];

// The CV content, unlike the messages, is read through its schema: the callers need completeness, not literals.
export function localeLayer(locale: Locale): { readonly messages: Messages; readonly cv: LocaleCv } {
  return LOCALE_LAYERS[locale].layer;
}

export function localeContentCoverage(locale: Locale): LocaleContentCoverage {
  return LOCALE_LAYERS[locale].contentCoverage;
}
