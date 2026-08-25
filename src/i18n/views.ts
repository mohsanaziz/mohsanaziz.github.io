import type { IconName } from '../components/icons.ts';
import {
  cv,
  type ClientProjectId,
  type ClientReference,
  type ContactDetailId,
  type Contract,
  type EmployerId,
  type ImageSource,
} from '../data/cv.ts';
import type { MissionReleaseData } from '../data/missions.ts';
import type { Period } from '../data/period.ts';
import type { LocaleCv } from './content.ts';
import { formatDigits } from './format.ts';
import { localeLayer } from './layers.ts';
import { localeFormatting, type Locale } from './locales.ts';
import { resumeFileName, resumePath } from './routing.ts';
import type { Translator } from './translate.ts';

// The invariant core and a locale layer meet here, and nowhere else: pages and components read view models
// in which every string is already the one their locale displays.

export interface ContactDetailView {
  id: ContactDetailId;
  title: string;
  info: string;
  icon: IconName;
  href?: string;
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
  metadata: LocaleCv['metadata'];
  profile: {
    image: { source: ImageSource; alt: string };
    name: string;
    alternateName?: string;
    jobTitle: string;
    socialLinks: (typeof cv)['profile']['socialLinks'];
    contactDetails: readonly ContactDetailView[];
    resume: { label: string; text: string; icon: IconName };
  };
  about: LocaleCv['about'];
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

export interface ReleaseAssetView {
  version: string;
  href: string;
  fileName: string;
}

function resolveClient(client: ClientReference, institutions: LocaleCv['institutions']): string {
  return 'institution' in client ? institutions[client.institution] : client.organisation;
}

function localizeDisplayStrings<TValue>(locale: Locale, value: TValue): TValue {
  if (localeFormatting(locale).numberingSystem === 'latn') return value;

  if (typeof value === 'string') {
    return formatDigits(locale, value) as TValue;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => localizeDisplayStrings(locale, entry)) as TValue;
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, localizeDisplayStrings(locale, entry)])) as TValue;
  }

  return value;
}

function contactHref(id: ContactDetailId, info: string): string | undefined {
  if (id === 'email') return `mailto:${info}`;

  if (id !== 'phone') return undefined;

  const digits = info.replace(/\D/g, '');
  const internationalNumber = digits.startsWith('0') ? `+33${digits.slice(1)}` : `+${digits}`;

  return `tel:${internationalNumber}`;
}

export function cvView(locale: Locale): CvView {
  const content = localizeDisplayStrings(locale, localeLayer(locale).cv);
  const localizedInvariantName = formatDigits(locale, cv.profile.name);

  return {
    metadata: content.metadata,
    profile: {
      image: { source: cv.profile.image.source, alt: content.profile.imageAlt },
      name: content.profile.name ?? localizedInvariantName,
      alternateName: content.profile.name && content.profile.name !== localizedInvariantName ? localizedInvariantName : undefined,
      jobTitle: content.profile.jobTitle,
      socialLinks: cv.profile.socialLinks,
      contactDetails: cv.profile.contactDetails.map((detail) => {
        const text = content.profile.contactDetails[detail.id];
        const info = 'info' in text ? text.info : 'info' in detail ? detail.info : undefined;

        if (info === undefined) {
          throw new Error(`The contact detail "${detail.id}" has no information in the "${locale}" layer.`);
        }

        const href = contactHref(detail.id, info);

        return {
          id: detail.id,
          title: text.title,
          info: formatDigits(locale, info),
          icon: detail.icon,
          ...(href === undefined ? {} : { href }),
        };
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
          name: text.name ?? formatDigits(locale, employer.name),
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
          name: text.name ?? formatDigits(locale, mission.name),
          client: formatDigits(locale, resolveClient(mission.client, content.institutions)),
          period: mission.period,
          technologies: mission.technologies.map((technology) => formatDigits(locale, technology)),
          description: text.description,
        };
      }),
    },
  };
}

export function releaseAssetView(locale: Locale, packageVersion: string): ReleaseAssetView {
  return {
    version: formatDigits(locale, `v${packageVersion}`),
    href: resumePath(locale),
    fileName: resumeFileName(locale),
  };
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
