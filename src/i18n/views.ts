import type { MissionReleaseData } from '@/data/missions';
import type { Period } from '@/data/period';
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

export interface MissionReleaseView<TMission extends MissionEntry, TEmployerId extends string> {
  mission: TMission;
  employerId: TEmployerId;
  summary: MissionSummaryView;
  showStatusBadge: boolean;
}

export function buildMissionReleaseViews<TEmployer extends EmployerEntry, TMission extends MissionEntry>(
  employers: readonly TEmployer[],
  missions: readonly TMission[],
  releases: readonly MissionReleaseData<TMission['id'], TEmployer['id']>[],
): readonly MissionReleaseView<TMission, TEmployer['id']>[] {
  const employersById = new Map<TEmployer['id'], TEmployer>(employers.map((employer) => [employer.id, employer]));
  const missionsById = new Map<TMission['id'], TMission>(missions.map((mission) => [mission.id, mission]));

  return releases.map(({ missionId, summary, showStatusBadge }) => {
    const mission = missionsById.get(missionId);
    const employer = employersById.get(summary.employerId);

    if (!mission) {
      throw new Error(`The mission "${missionId}" is missing.`);
    }

    if (!employer) {
      throw new Error(`The employer of the mission "${missionId}" is missing.`);
    }

    return {
      mission,
      employerId: summary.employerId,
      summary: formatMissionSummary(summary, mission, employer.title),
      showStatusBadge,
    };
  });
}
