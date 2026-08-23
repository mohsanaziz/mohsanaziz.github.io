import { getPeriodDurationInMonths, sortByMostRecentPeriod } from './career.ts';
import type { Period } from './period.ts';

interface MissionEntry {
  id: string;
  period: Period;
}

export type MissionStatus = 'current' | 'delivered';

export interface MissionSummaryData<TEmployerId extends string = string> {
  period: Period;
  durationInMonths: number;
  status: MissionStatus;
  employerId: TEmployerId;
  versionNumber: number;
}

export interface MissionReleaseData<TMissionId extends string = string, TEmployerId extends string = string> {
  missionId: TMissionId;
  summary: MissionSummaryData<TEmployerId>;
  showStatusBadge: boolean;
}

export function deriveMissionReleases<TMission extends MissionEntry, TEmployerId extends string>(
  missions: readonly TMission[],
  employersByMission: ReadonlyMap<TMission['id'], TEmployerId>,
  currentDate = new Date(),
): readonly MissionReleaseData<TMission['id'], TEmployerId>[] {
  const sortedMissions = sortByMostRecentPeriod(missions);
  const missionCount = sortedMissions.length;

  return sortedMissions.map((mission, index) => {
    const current = mission.period.end === null;
    const employerId = employersByMission.get(mission.id);

    if (!employerId) {
      throw new Error(`No employer is mapped to the mission "${mission.id}"`);
    }

    return {
      missionId: mission.id,
      summary: {
        period: mission.period,
        durationInMonths: getPeriodDurationInMonths(mission.period, currentDate),
        status: current ? 'current' : 'delivered',
        employerId,
        versionNumber: missionCount - index,
      },
      showStatusBadge: index === 0 && current,
    };
  });
}
