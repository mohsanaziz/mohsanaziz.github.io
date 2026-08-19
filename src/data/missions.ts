import { formatPeriodDuration, isCurrentPeriod, sortByMostRecentPeriod } from '@/data/career';

interface MissionEntry {
  title: string;
  subtitle: string;
  date: string;
  technologies: readonly string[];
}

interface EmployerEntry {
  title: string;
}

export type MissionStatus = 'En cours' | 'Livrée';

export interface MissionSummaryData {
  client: string;
  period: string;
  duration: string;
  status: MissionStatus;
  employer: string;
  version: string;
  technologies: readonly string[];
}

export interface MissionReleaseData<TMission extends MissionEntry> {
  mission: TMission;
  summary: MissionSummaryData;
  showStatusBadge: boolean;
}

export function deriveMissionReleases<TMission extends MissionEntry, TEmployer extends EmployerEntry>(
  missions: readonly TMission[],
  employersByMission: ReadonlyMap<TMission, TEmployer>,
  currentDate = new Date(),
): readonly MissionReleaseData<TMission>[] {
  const sortedMissions = sortByMostRecentPeriod(missions, currentDate);
  const missionCount = sortedMissions.length;

  return sortedMissions.map((mission, index) => {
    const current = isCurrentPeriod(mission.date, currentDate);
    const employer = employersByMission.get(mission);

    if (!employer) {
      throw new Error(`L'employeur de la mission « ${mission.title} » est introuvable`);
    }

    return {
      mission,
      summary: {
        client: mission.subtitle,
        period: mission.date,
        duration: formatPeriodDuration(mission.date, currentDate),
        status: current ? 'En cours' : 'Livrée',
        employer: employer.title,
        version: `v${missionCount - index}.0.0`,
        technologies: mission.technologies,
      },
      showStatusBadge: index === 0 && current,
    };
  });
}
