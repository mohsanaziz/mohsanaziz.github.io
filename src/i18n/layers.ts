import type { LocaleCv, PartialLocaleCv } from './content.ts';
import * as ar from './ar.ts';
import * as en from './en.ts';
import * as fr from './fr.ts';
import type { Locale } from './locales.ts';
import type { LocaleMessages } from './messages.ts';

interface LocaleLayer {
  readonly messages: LocaleMessages;
  readonly cv: LocaleCv;
}

interface PartialLocaleLayer {
  readonly messages: LocaleMessages;
  readonly cv: PartialLocaleCv;
}

type LocaleContentCoverage = 'complete' | 'interface-only';

interface LocaleLayerDefinition {
  readonly layer: LocaleLayer | PartialLocaleLayer;
  readonly contentCoverage: LocaleContentCoverage;
}

// The definition keeps the rendered layer and its coverage together. Arabic remains interface-only until
// the CV content itself is translated, even though it now owns a partial layer.
const LOCALE_LAYERS = {
  fr: { layer: fr, contentCoverage: 'complete' },
  en: { layer: en, contentCoverage: 'complete' },
  ar: { layer: ar, contentCoverage: 'interface-only' },
} as const satisfies Record<Locale, LocaleLayerDefinition>;

// Deliberately the union of the layers' literal types rather than the schema: a message keeps its literal
// type through every lookup, which is what lets `formatMessage` check its placeholders at the call site.
export type Messages = (typeof LOCALE_LAYERS)[Locale]['layer']['messages'];

function isMergeableObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeWithFallback<TValue>(fallback: TValue, partial: PartialLocaleCv | TValue): TValue {
  if (!isMergeableObject(fallback) || !isMergeableObject(partial)) {
    return partial as TValue;
  }

  const merged: Record<string, unknown> = { ...fallback };

  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;

    const fallbackValue = fallback[key];
    merged[key] = isMergeableObject(fallbackValue) && isMergeableObject(value) ? mergeWithFallback(fallbackValue, value) : value;
  }

  return merged as TValue;
}

// Partial layers are completed once at module initialization. Keeping the resolved value typed as a
// LocaleLayer makes it impossible for localeLayer() to expose an incomplete CV at compile time.
const RESOLVED_ARABIC_LAYER = {
  messages: ar.messages,
  cv: mergeWithFallback(fr.cv, ar.cv),
} as const satisfies LocaleLayer;

// The CV content, unlike the messages, is read through its schema: the merge needs completeness, not literals.
export function localeLayer(locale: Locale): { readonly messages: Messages; readonly cv: LocaleCv } {
  if (locale === 'ar') {
    return RESOLVED_ARABIC_LAYER;
  }

  return LOCALE_LAYERS[locale].layer;
}

export function localeContentCoverage(locale: Locale): LocaleContentCoverage {
  return LOCALE_LAYERS[locale].contentCoverage;
}
