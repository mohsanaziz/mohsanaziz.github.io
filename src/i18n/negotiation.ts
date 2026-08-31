import { transform } from 'esbuild';

import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales.ts';
import { negotiateLanguage, type NegotiationConfiguration } from './negotiate-language.ts';
import { localeHomePath } from './routing.ts';

// The opt-out marker is named once here, then shared by the inline script, the language selector and the 404.
export const LANGUAGE_CHOICE_PARAMETER = 'lang';

// Derived from the single locale list and the routing helper: a fourth language joins the served map
// without touching the script itself.
export function negotiationConfiguration(): NegotiationConfiguration {
  return {
    parameter: LANGUAGE_CHOICE_PARAMETER,
    home: localeHomePath(DEFAULT_LOCALE),
    paths: Object.fromEntries(LOCALES.map((locale) => [locale, localeHomePath(locale)])),
  };
}

// Only the root negotiates, so only the link leading back to it carries the marker. The prefixed URLs already
// name their language and stay bare. The marker is never cleaned up: a reload must not undo the choice.
export function languageChoiceHref(locale: Locale, href: string): string {
  return locale === DEFAULT_LOCALE ? `${href}?${LANGUAGE_CHOICE_PARAMETER}=${locale}` : href;
}

// Astro's script pipeline defers execution, which would flash the French page before the jump; the negotiation
// therefore ships inline and synchronous. Minifying here keeps the shipped bytes derived from a readable
// source that `astro check` verifies, instead of a hand-compressed string.
export async function inlineNegotiationScript(): Promise<string> {
  const call = `(${negotiateLanguage.toString()})(${JSON.stringify(negotiationConfiguration())});`;
  const { code } = await transform(call, { minify: true });

  return code.trim();
}
