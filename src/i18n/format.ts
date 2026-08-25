import { parseMachineMonth, type Period } from '../data/period.ts';
import type { Locale } from './locales.ts';
import { formatMessage, type LocaleMessages, type PluralMessage } from './messages.ts';

const MONTH_FORMATTERS = new Map<Locale, Intl.DateTimeFormat>();
const NUMBER_FORMATTERS = new Map<Locale, Intl.NumberFormat>();
const PERCENTAGE_FORMATTERS = new Map<Locale, Intl.NumberFormat>();
const PLURAL_RULES = new Map<Locale, Intl.PluralRules>();

// Intl formatters are costly to build and the build renders every page of every locale, so keep one per locale.
function cached<TFormatter>(cache: Map<Locale, TFormatter>, locale: Locale, create: () => TFormatter): TFormatter {
  let formatter = cache.get(locale);

  if (formatter === undefined) {
    formatter = create();
    cache.set(locale, formatter);
  }

  return formatter;
}

function formatNumber(locale: Locale, value: number): string {
  return cached(NUMBER_FORMATTERS, locale, () => new Intl.NumberFormat(locale)).format(value);
}

/** Renders a share expressed in percentage points, spacing and symbol included. */
export function formatPercentage(locale: Locale, percentagePoints: number): string {
  return cached(PERCENTAGE_FORMATTERS, locale, () => new Intl.NumberFormat(locale, { style: 'percent' })).format(percentagePoints / 100);
}

export function formatPlural(locale: Locale, forms: PluralMessage, count: number): string {
  const category = cached(PLURAL_RULES, locale, () => new Intl.PluralRules(locale)).select(count);

  return formatMessage(forms[category] ?? forms.other, { count: formatNumber(locale, count) });
}

function formatMonth(locale: Locale, bound: string): string {
  const { year, month } = parseMachineMonth(bound);
  const formatter = cached(
    MONTH_FORMATTERS,
    locale,
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  );
  const label = formatter.format(new Date(Date.UTC(year, month - 1)));

  return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
}

export function formatPeriod(locale: Locale, messages: LocaleMessages, period: Period): string {
  const end = period.end === null ? messages.dates.present : formatMonth(locale, period.end);

  return `${formatMonth(locale, period.start)} - ${end}`;
}

export function formatDuration(locale: Locale, messages: LocaleMessages, totalMonths: number): string {
  if (totalMonths < 12) {
    return formatPlural(locale, messages.counts.month, totalMonths);
  }

  const years = formatPlural(locale, messages.counts.year, Math.floor(totalMonths / 12));
  const months = totalMonths % 12;

  return months === 0 ? years : `${years} ${formatPlural(locale, messages.counts.month, months)}`;
}

export function formatVersion(versionNumber: number): string {
  return `v${versionNumber}.0.0`;
}
