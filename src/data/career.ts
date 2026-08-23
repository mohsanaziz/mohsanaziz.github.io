export interface Period {
  /** Machine month, `YYYY-MM`. */
  start: string;
  /** Machine month, `YYYY-MM`, or `null` while the period is ongoing. */
  end: string | null;
}

interface PeriodEntry {
  period: Period;
}

interface IdentifiedPeriodEntry extends PeriodEntry {
  id: string;
}

const MACHINE_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

function toMonthIndex(bound: string): number {
  const match = MACHINE_MONTH_PATTERN.exec(bound);

  if (!match) {
    throw new Error(`Invalid machine month, expected YYYY-MM: "${bound}"`);
  }

  return Number(match[1]) * 12 + Number(match[2]) - 1;
}

function currentMonthIndex(currentDate: Date): number {
  return currentDate.getFullYear() * 12 + currentDate.getMonth();
}

function endMonthIndex(period: Period, fallbackMonthIndex: number): number {
  return period.end === null ? fallbackMonthIndex : toMonthIndex(period.end);
}

export function getPeriodDurationInMonths(period: Period, currentDate = new Date()): number {
  return Math.max(1, endMonthIndex(period, currentMonthIndex(currentDate)) - toMonthIndex(period.start));
}

export function sortByMostRecentPeriod<TEntry extends PeriodEntry>(entries: readonly TEntry[]): readonly TEntry[] {
  return [...entries].sort((first, second) => {
    const startDifference = toMonthIndex(second.period.start) - toMonthIndex(first.period.start);

    return (
      startDifference || endMonthIndex(second.period, Number.POSITIVE_INFINITY) - endMonthIndex(first.period, Number.POSITIVE_INFINITY)
    );
  });
}

export function mapMissionsToEmployers(
  employers: readonly IdentifiedPeriodEntry[],
  missions: readonly IdentifiedPeriodEntry[],
): ReadonlyMap<string, string> {
  const employerStarts = employers.map((employer) => ({
    id: employer.id,
    start: toMonthIndex(employer.period.start),
  }));

  return new Map(
    missions.map((mission) => {
      const missionStart = toMonthIndex(mission.period.start);
      const employer = employerStarts
        .filter(({ start }) => start <= missionStart)
        .reduce<(typeof employerStarts)[number] | undefined>(
          (latestEmployer, candidate) => (latestEmployer && latestEmployer.start >= candidate.start ? latestEmployer : candidate),
          undefined,
        );

      if (!employer) {
        throw new Error(`No employer starts before the mission "${mission.id}"`);
      }

      return [mission.id, employer.id] as const;
    }),
  );
}

export function countMissionsByEmployer(
  employers: readonly { id: string }[],
  employersByMission: ReadonlyMap<string, string>,
): ReadonlyMap<string, number> {
  const missionCounts = new Map<string, number>(employers.map(({ id }) => [id, 0]));

  for (const [missionId, employerId] of employersByMission) {
    const currentCount = missionCounts.get(employerId);

    if (currentCount === undefined) {
      throw new Error(`Unknown employer "${employerId}" for the mission "${missionId}"`);
    }

    missionCounts.set(employerId, currentCount + 1);
  }

  return missionCounts;
}

export function getCareerDurationInYears(employers: readonly PeriodEntry[], currentDate = new Date()): number {
  if (employers.length === 0) {
    return 0;
  }

  const nowIndex = currentMonthIndex(currentDate);
  const firstStart = Math.min(...employers.map(({ period }) => toMonthIndex(period.start)));
  const lastEnd = Math.max(...employers.map(({ period }) => endMonthIndex(period, nowIndex)));

  return Math.floor(Math.max(0, lastEnd - firstStart) / 12);
}
