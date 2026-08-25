import type { IconName } from '../components/icons.ts';
import { cv, type ClientProjectId, type ClientReference, type ContactDetailId, type Contract, type EmployerId } from '../data/cv.ts';
import type { MissionReleaseData } from '../data/missions.ts';
import type { Period } from '../data/period.ts';
import { localeLayer, type Content } from './layers.ts';
import type { Locale } from './locales.ts';
import type { Translator } from './translate.ts';

// The invariant core and a locale layer meet here, and nowhere else: pages and components read view models
// in which every string is already the one their locale displays.

export interface ContactDetailView {
  id: ContactDetailId;
  title: string;
  info: string;
  icon: IconName;
}

export interface EmployerView {
  id: EmployerId;
  name: string;
  jobTitle: string;
  contract: Contract;
  period: Period;
}

export interface ClientProjectView {
  id: ClientProjectId;
  name: string;
  client: string;
  period: Period;
  technologies: readonly string[];
  description: readonly string[];
}

export interface CvView {
  metadata: Content['metadata'];
  profile: {
    name: string;
    imageAlt: string;
    jobTitle: string;
    socialLinks: (typeof cv)['profile']['socialLinks'];
    contactDetails: readonly ContactDetailView[];
    resume: { label: string; text: string; icon: IconName };
  };
  about: Content['about'];
  professionalExperience: { title: string; entries: readonly EmployerView[] };
  clientProjects: { title: string; entries: readonly ClientProjectView[] };
}

export interface MissionSummaryView {
  client: string;
  period: string;
  duration: string;
  status: string;
  employer: string;
  version: string;
  technologies: readonly string[];
}

export interface MissionReleaseView {
  mission: ClientProjectView;
  employerId: EmployerId;
  summary: MissionSummaryView;
  showStatusBadge: boolean;
}

const CV_VIEWS = new Map<Locale, CvView>();

function resolveClient(client: ClientReference, institutions: Content['institutions']): string {
  return 'institution' in client ? institutions[client.institution] : client.organisation;
}

function buildCvView(locale: Locale): CvView {
  const content = localeLayer(locale).cv;

  return {
    metadata: content.metadata,
    profile: {
      name: content.profile.name ?? cv.profile.name,
      imageAlt: content.profile.imageAlt,
      jobTitle: content.profile.jobTitle,
      socialLinks: cv.profile.socialLinks,
      contactDetails: cv.profile.contactDetails.map((detail) => {
        const text = content.profile.contactDetails[detail.id];
        const info = 'info' in text ? text.info : 'info' in detail ? detail.info : undefined;

        if (info === undefined) {
          throw new Error(`The contact detail "${detail.id}" has no information in the "${locale}" layer.`);
        }

        return { id: detail.id, title: text.title, info, icon: detail.icon };
      }),
      resume: { ...cv.profile.resume, text: content.profile.resume.text },
    },
    about: content.about,
    professionalExperience: {
      title: content.professionalExperience.title,
      entries: cv.professionalExperience.entries.map((employer) => {
        const text = content.professionalExperience.entries[employer.id];

        return {
          id: employer.id,
          name: text.name ?? employer.name,
          jobTitle: text.jobTitle,
          contract: employer.contract,
          period: employer.period,
        };
      }),
    },
    clientProjects: {
      title: content.clientProjects.title,
      entries: cv.clientProjects.entries.map((mission) => {
        const text = content.clientProjects.entries[mission.id];

        return {
          id: mission.id,
          name: text.name ?? mission.name,
          client: resolveClient(mission.client, content.institutions),
          period: mission.period,
          technologies: mission.technologies,
          description: text.description,
        };
      }),
    },
  };
}

/** The merge is pure, and the build renders each locale several times: compute it once per locale. */
export function cvView(locale: Locale): CvView {
  let view = CV_VIEWS.get(locale);

  if (view === undefined) {
    view = buildCvView(locale);
    CV_VIEWS.set(locale, view);
  }

  return view;
}

export function buildMissionReleaseViews(
  translate: Translator,
  view: CvView,
  releases: readonly MissionReleaseData<ClientProjectId, EmployerId>[],
): readonly MissionReleaseView[] {
  const employersById = new Map(view.professionalExperience.entries.map((employer) => [employer.id, employer]));
  const missionsById = new Map(view.clientProjects.entries.map((mission) => [mission.id, mission]));

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
      summary: {
        client: mission.client,
        period: translate.period(summary.period),
        duration: translate.duration(summary.durationInMonths),
        status: translate.missionStatus(summary.status),
        employer: employer.name,
        version: translate.version(summary.versionNumber),
        technologies: mission.technologies,
      },
      showStatusBadge,
    };
  });
}
