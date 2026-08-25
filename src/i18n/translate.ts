import type { Contract } from '../data/cv.ts';
import type { MissionStatus } from '../data/missions.ts';
import type { Period } from '../data/period.ts';
import { formatDuration, formatPercentage, formatPeriod, formatPlural, formatVersion } from './format.ts';
import { localeLayer, type Messages } from './layers.ts';
import { requireLocale, type Locale } from './locales.ts';
import type { CountKey } from './messages.ts';

export interface Translator {
  readonly locale: Locale;
  readonly messages: Messages;
  /** Renders a count in the plural form its locale selects for that number. */
  count(key: CountKey, value: number): string;
  period(period: Period): string;
  duration(totalMonths: number): string;
  percentage(percentagePoints: number): string;
  /** Closes a field label with the colon its locale spells, spacing included. */
  fieldLabel(label: string): string;
  version(versionNumber: number): string;
  contract(contract: Contract): string;
  missionStatus(status: MissionStatus): string;
}

/** Binds the current locale's layer and formatters; components read it from `Astro.currentLocale`. */
export function useTranslations(currentLocale: unknown): Translator {
  const locale = requireLocale(currentLocale);
  const { messages } = localeLayer(locale);

  return {
    locale,
    messages,
    count: (key, value) => formatPlural(locale, messages.counts[key], value),
    period: (period) => formatPeriod(locale, messages, period),
    duration: (totalMonths) => formatDuration(locale, messages, totalMonths),
    percentage: (percentagePoints) => formatPercentage(locale, percentagePoints),
    fieldLabel: (label) => `${label}${messages.punctuation.labelColon}`,
    version: (versionNumber) => formatVersion(locale, versionNumber),
    contract: (contract) => messages.contract[contract],
    missionStatus: (status) => messages.missionStatus[status],
  };
}
