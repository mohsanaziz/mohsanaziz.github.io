import { getPeriodDurationInMonths, sortByMostRecentPeriod, type Period } from '@/data/career';

interface MissionEntry {
  id: string;
  period: Period;
}

export type MissionStatus = 'current' | 'delivered';

export interface MissionSummaryData {
  period: Period;
  durationInMonths: number;
  status: MissionStatus;
  employerId: string;
  versionNumber: number;
}

export interface MissionReleaseData<TMission extends MissionEntry> {
  mission: TMission;
  summary: MissionSummaryData;
  showStatusBadge: boolean;
}

export function deriveMissionReleases<TMission extends MissionEntry>(
  missions: readonly TMission[],
  employersByMission: ReadonlyMap<string, string>,
  currentDate = new Date(),
): readonly MissionReleaseData<TMission>[] {
  const sortedMissions = sortByMostRecentPeriod(missions);
  const missionCount = sortedMissions.length;

  return sortedMissions.map((mission, index) => {
    const current = mission.period.end === null;
    const employerId = employersByMission.get(mission.id);

    if (!employerId) {
      throw new Error(`No employer is mapped to the mission "${mission.id}"`);
    }

    return {
      mission,
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
