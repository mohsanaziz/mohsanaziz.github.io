interface PeriodEntry {
  date: string;
}

interface ParsedPeriod {
  start: number;
  end: number;
}

const MONTHS = new Map(
  ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'].map(
    (month, index) => [normalize(month), index],
  ),
);

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function parsePeriodBound(bound: string, currentDate = new Date()): number {
  const normalizedBound = normalize(bound);

  if (/^aujourd['’]hui$/.test(normalizedBound)) {
    return currentDate.getFullYear() + currentDate.getMonth() / 12;
  }

  const match = /^(\p{L}+)\s+(\d{4})$/u.exec(normalizedBound);
  const month = match?.[1] ? MONTHS.get(match[1]) : undefined;
  const year = match?.[2] ? Number(match[2]) : Number.NaN;

  if (month === undefined || !Number.isInteger(year)) {
    throw new Error(`Borne de période invalide : « ${bound} »`);
  }

  return year + month / 12;
}

export function parsePeriod(period: string, currentDate = new Date()): ParsedPeriod {
  const match = /^(.*?)\s+-\s+(.*?)$/.exec(period.trim());

  if (!match?.[1] || !match[2]) {
    throw new Error(`Période invalide : « ${period} »`);
  }

  return {
    start: parsePeriodBound(match[1], currentDate),
    end: parsePeriodBound(match[2], currentDate),
  };
}

export function getPeriodDurationInMonths(period: string, currentDate = new Date()): number {
  const { start, end } = parsePeriod(period, currentDate);
  return Math.max(1, Math.round((end - start) * 12));
}

export function formatPeriodDuration(period: string, currentDate = new Date()): string {
  const totalMonths = getPeriodDurationInMonths(period, currentDate);

  if (totalMonths < 12) {
    return `${totalMonths} mois`;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const formattedYears = `${years} ${years === 1 ? 'an' : 'ans'}`;

  return months === 0 ? formattedYears : `${formattedYears} ${months} mois`;
}

export function findEmployerForMission<TEmployer extends PeriodEntry>(
  mission: PeriodEntry,
  employers: readonly TEmployer[],
  currentDate = new Date(),
): TEmployer | undefined {
  const missionStart = parsePeriod(mission.date, currentDate).start;

  return employers.reduce<TEmployer | undefined>((latestEmployer, employer) => {
    const employerStart = parsePeriod(employer.date, currentDate).start;

    if (employerStart > missionStart) {
      return latestEmployer;
    }

    if (!latestEmployer) {
      return employer;
    }

    const latestStart = parsePeriod(latestEmployer.date, currentDate).start;
    return employerStart > latestStart ? employer : latestEmployer;
  }, undefined);
}

export function countMissionsForEmployer<TEmployer extends PeriodEntry>(
  employer: TEmployer,
  employers: readonly TEmployer[],
  missions: readonly PeriodEntry[],
  currentDate = new Date(),
): number {
  return missions.filter((mission) => findEmployerForMission(mission, employers, currentDate) === employer).length;
}

export function getCareerDurationInYears(employers: readonly PeriodEntry[], currentDate = new Date()): number {
  if (employers.length === 0) {
    return 0;
  }

  const periods = employers.map(({ date }) => parsePeriod(date, currentDate));
  const firstStart = Math.min(...periods.map(({ start }) => start));
  const lastEnd = Math.max(...periods.map(({ end }) => end));

  return Math.floor(Math.max(0, Math.round((lastEnd - firstStart) * 12)) / 12);
}
