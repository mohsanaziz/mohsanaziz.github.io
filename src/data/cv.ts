import type { IconName } from '@/components/icons';
import type { Period } from './period.ts';

// Invariant core of the CV: identifiers, machine periods, technologies, URLs, e-mail, icons and contract tokens.
// No natural-language sentence lives here — every translatable string belongs to a locale layer (see ADR 0007 §2).

export type ContactDetailId = 'phone' | 'email' | 'location' | 'birthdate';

export type Contract = 'freelance' | 'permanent';

// Institutions carry an established exonym, so their name is translated; every other client name is invariant.
export type InstitutionId = 'frenchMinistryOfJustice';

export type ClientReference = { readonly organisation: string } | { readonly institution: InstitutionId };

interface CvLink {
  href: string;
  label: string;
  icon: IconName;
}

interface ContactPoint {
  id: ContactDetailId;
  icon: IconName;
  /** Invariant contact information; the locale layer supplies it when it is absent here. */
  info?: string;
}

interface TimelineEntry {
  id: string;
  name: string;
  period: Period;
}

interface CareerEntry extends TimelineEntry {
  contract: Contract;
}

interface ClientProjectEntry extends TimelineEntry {
  client: ClientReference;
  technologies: readonly string[];
}

interface CvCore {
  profile: {
    /** The portrait, named by its asset file; `src/data/images.ts` resolves it to Astro image metadata. */
    image: { source: string };
    name: string;
    socialLinks: readonly CvLink[];
    contactDetails: readonly ContactPoint[];
    resume: Omit<CvLink, 'href'>;
  };
  professionalExperience: {
    entries: readonly CareerEntry[];
  };
  clientProjects: {
    entries: readonly ClientProjectEntry[];
  };
}

export const cv = {
  profile: {
    image: { source: 'photo.jpg' },
    name: 'Mohsan AZIZ',
    socialLinks: [
      {
        href: 'https://github.com/mohsanaziz',
        label: 'GitHub',
        icon: 'github',
      },
      {
        href: 'https://fr.linkedin.com/in/mohsanaziz',
        label: 'LinkedIn',
        icon: 'linkedin',
      },
    ],
    contactDetails: [
      {
        id: 'phone',
        info: '06.28.74.61.76',
        icon: 'phone',
      },
      {
        id: 'email',
        info: 'mohsan.aziz@gmail.com',
        icon: 'mail',
      },
      {
        id: 'location',
        icon: 'location',
      },
      {
        id: 'birthdate',
        icon: 'cake',
      },
    ],
    resume: {
      label: 'CV',
      icon: 'pdf',
    },
  },
  professionalExperience: {
    entries: [
      {
        id: 'azmopak',
        name: 'SASU AZMOPAK',
        period: { start: '2019-11', end: null },
        contract: 'freelance',
      },
      {
        id: 'sopraSteria',
        name: 'Sopra Steria',
        period: { start: '2016-05', end: '2019-09' },
        contract: 'permanent',
      },
    ],
  },
  clientProjects: {
    entries: [
      {
        id: 'atlasIhm',
        name: 'ATLAS IHM',
        client: { organisation: 'Saint-Gobain' },
        period: { start: '2022-09', end: null },
        technologies: [
          'Java',
          'Spring Boot',
          'Angular',
          'RxJS',
          'Ngrx',
          'Bootstrap',
          'npm',
          'git',
          'Docker',
          'Kubernetes',
          'Jenkins',
          'Gitlab',
          'Confluence',
          'Jira',
        ],
      },
      {
        id: 'sps',
        name: 'SPS',
        client: { institution: 'frenchMinistryOfJustice' },
        period: { start: '2022-03', end: '2022-06' },
        technologies: [
          'Java',
          'Spring Boot',
          'Hibernate',
          'PostgreSQL',
          'ElasticSearch',
          'Zuul',
          'Spring Batch',
          'Spring Data JPA',
          'Angular',
          'Angular Material',
          'RxJS',
          'Bootstrap',
          'npm',
          'git',
          'Docker',
          'Docker Compose',
          'Openshift',
          'Jenkins',
          'Gitlab',
          'Nexus',
          'Confluence',
          'Jira',
        ],
      },
      {
        id: 'siaj',
        name: 'SIAJ',
        client: { institution: 'frenchMinistryOfJustice' },
        period: { start: '2020-10', end: '2021-12' },
        technologies: [
          'Java',
          'Spring Boot',
          'Hibernate',
          'PostgreSQL',
          'Zuul',
          'Spring Batch',
          'Spring Data JPA',
          'Angular',
          'Angular Material',
          'RxJS',
          'Bootstrap',
          'npm',
          'git',
          'Docker',
          'Docker Compose',
          'Openshift',
          'Jenkins',
          'Gitlab',
          'Nexus',
          'Confluence',
          'Jira',
        ],
      },
      {
        id: 'parcours',
        name: 'PARCOURS',
        client: { institution: 'frenchMinistryOfJustice' },
        period: { start: '2020-02', end: '2020-05' },
        technologies: [
          'Java',
          'Spring Boot',
          'Hibernate',
          'PostgreSQL',
          'Zuul',
          'Spring Data JPA',
          'Lombok',
          'Angular',
          'Angular Material',
          'RxJS',
          'npm',
          'git',
          'Docker',
          'Docker Compose',
          'Openshift',
          'Jenkins',
          'Gitlab',
          'Nexus',
          'Confluence',
          'Jira',
        ],
      },
      {
        id: 'ims',
        name: 'IMS',
        client: { organisation: 'Française des Jeux - Gaming Solution (FDJ-GS)' },
        period: { start: '2019-11', end: '2019-12' },
        technologies: [
          'Java',
          'Hibernate',
          'PostgreSQL',
          'Spring Data JPA',
          'Angular',
          'Angular Material',
          'RxJS',
          'npm',
          'git',
          'Bitbucket',
          'Confluence',
          'Jira',
        ],
      },
      {
        id: 'portalisV3',
        name: 'PORTALIS V3',
        client: { institution: 'frenchMinistryOfJustice' },
        period: { start: '2018-04', end: '2019-09' },
        technologies: [
          'Java',
          'Spring Boot',
          'MyBatis',
          'PostgreSQL',
          'Zuul',
          'Spring Batch',
          'Angular',
          'Angular Material',
          'RxJS',
          'Bootstrap',
          'npm',
          'git',
          'Docker',
          'Docker Compose',
          'Openshift',
          'Jenkins',
          'Gitlab',
          'Nexus',
          'Confluence',
          'Jira',
        ],
      },
    ],
  },
} as const satisfies CvCore;

export type ImageSource = (typeof cv.profile.image)['source'];

export type EmployerId = (typeof cv.professionalExperience.entries)[number]['id'];

export type ClientProjectId = (typeof cv.clientProjects.entries)[number]['id'];

/** Contact details whose information is invariant: a locale layer only names them. */
export type InvariantContactDetailId = Extract<(typeof cv.profile.contactDetails)[number], { info: string }>['id'];
