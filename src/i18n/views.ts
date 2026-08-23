import type { Period } from '@/data/career';
import { deriveMissionReleases } from '@/data/missions';
import { formatMissionSummary, type MissionSummaryView } from '@/i18n/format';

interface EmployerEntry {
  id: string;
  title: string;
}

interface MissionEntry {
  id: string;
  title: string;
  subtitle: string;
  period: Period;
  technologies: readonly string[];
}

export interface MissionReleaseView<TMission extends MissionEntry> {
  mission: TMission;
  employerId: string;
  summary: MissionSummaryView;
  showStatusBadge: boolean;
}

export function buildMissionReleaseViews<TMission extends MissionEntry>(
  employers: readonly EmployerEntry[],
  missions: readonly TMission[],
  employersByMission: ReadonlyMap<string, string>,
  currentDate = new Date(),
): readonly MissionReleaseView<TMission>[] {
  const employersById = new Map<string, EmployerEntry>(employers.map((employer) => [employer.id, employer]));

  return deriveMissionReleases(missions, employersByMission, currentDate).map(({ mission, summary, showStatusBadge }) => {
    const employer = employersById.get(summary.employerId);

    if (!employer) {
      throw new Error(`The employer of the mission ${mission.title} is missing.`);
    }

    return {
      mission,
      employerId: summary.employerId,
      summary: formatMissionSummary(summary, mission, employer.title),
      showStatusBadge,
    };
  });
}
