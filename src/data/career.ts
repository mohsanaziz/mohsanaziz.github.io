import { machineMonthToIndex, type Period } from './period.ts';

interface PeriodEntry {
  period: Period;
}

interface IdentifiedPeriodEntry<TId extends string> extends PeriodEntry {
  id: TId;
}

function currentMonthIndex(currentDate: Date): number {
  return currentDate.getFullYear() * 12 + currentDate.getMonth();
}

function endMonthIndex(period: Period, fallbackMonthIndex: number): number {
  return period.end === null ? fallbackMonthIndex : machineMonthToIndex(period.end);
}

export function getPeriodDurationInMonths(period: Period, currentDate = new Date()): number {
  return Math.max(1, endMonthIndex(period, currentMonthIndex(currentDate)) - machineMonthToIndex(period.start));
}

export function sortByMostRecentPeriod<TEntry extends PeriodEntry>(entries: readonly TEntry[]): readonly TEntry[] {
  return [...entries].sort((first, second) => {
    const startDifference = machineMonthToIndex(second.period.start) - machineMonthToIndex(first.period.start);

    return (
      startDifference || endMonthIndex(second.period, Number.POSITIVE_INFINITY) - endMonthIndex(first.period, Number.POSITIVE_INFINITY)
    );
  });
}

export function mapMissionsToEmployers<TEmployerId extends string, TMissionId extends string>(
  employers: readonly IdentifiedPeriodEntry<TEmployerId>[],
  missions: readonly IdentifiedPeriodEntry<TMissionId>[],
): ReadonlyMap<TMissionId, TEmployerId> {
  const employerStarts = employers.map((employer) => ({
    id: employer.id,
    start: machineMonthToIndex(employer.period.start),
  }));

  return new Map(
    missions.map((mission) => {
      const missionStart = machineMonthToIndex(mission.period.start);
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

export function countMissionsByEmployer<TEmployerId extends string, TMissionId extends string>(
  employers: readonly { id: TEmployerId }[],
  employersByMission: ReadonlyMap<TMissionId, TEmployerId>,
): ReadonlyMap<TEmployerId, number> {
  const missionCounts = new Map<TEmployerId, number>(employers.map(({ id }) => [id, 0]));

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
  const firstStart = Math.min(...employers.map(({ period }) => machineMonthToIndex(period.start)));
  const lastEnd = Math.max(...employers.map(({ period }) => endMonthIndex(period, nowIndex)));

  return Math.floor(Math.max(0, lastEnd - firstStart) / 12);
}
