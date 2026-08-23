import type { Period } from '@/data/career';
import type { Contract } from '@/data/cv';
import type { MissionStatus, MissionSummaryData } from '@/data/missions';

const LOCALE = 'fr';

const PERIOD_BOUND_FORMATTER = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' });

export const CONTRACT_LABELS: Record<Contract, string> = {
  freelance: 'Freelance',
  permanent: 'CDI',
};

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  current: 'En cours',
  delivered: 'Livrée',
};

export interface MissionSummaryView {
  client: string;
  period: string;
  duration: string;
  status: string;
  employer: string;
  version: string;
  technologies: readonly string[];
}

function formatPeriodBound(bound: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(bound);

  if (!match) {
    throw new Error(`Invalid machine month, expected YYYY-MM: "${bound}"`);
  }

  const label = PERIOD_BOUND_FORMATTER.format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1)));

  return label.charAt(0).toLocaleUpperCase(LOCALE) + label.slice(1);
}

export function formatPeriod(period: Period): string {
  return `${formatPeriodBound(period.start)} - ${period.end === null ? "Aujourd'hui" : formatPeriodBound(period.end)}`;
}

export function formatDurationInMonths(totalMonths: number): string {
  if (totalMonths < 12) {
    return `${totalMonths} mois`;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const formattedYears = `${years} ${years === 1 ? 'an' : 'ans'}`;

  return months === 0 ? formattedYears : `${formattedYears} ${months} mois`;
}

export function formatVersion(versionNumber: number): string {
  return `v${versionNumber}.0.0`;
}

export function formatMissionSummary(
  summary: MissionSummaryData,
  mission: { subtitle: string; technologies: readonly string[] },
  employerName: string,
): MissionSummaryView {
  return {
    client: mission.subtitle,
    period: formatPeriod(summary.period),
    duration: formatDurationInMonths(summary.durationInMonths),
    status: MISSION_STATUS_LABELS[summary.status],
    employer: employerName,
    version: formatVersion(summary.versionNumber),
    technologies: mission.technologies,
  };
}
