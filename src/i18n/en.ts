// Terminology: CDI → “Permanent” as a concise CV label, not a legal equivalent;
// mission → “project” in reader-facing CV copy; Ministère de la Justice →
// “French Ministry of Justice”; conseils de prud’hommes → “French employment
// tribunals”; semi-Agile methodology → “hybrid Agile delivery model”. Product,
// employer and technology names remain unchanged in the invariant core.

import type { LocaleCv } from './content.ts';
import { defineMessages } from './messages.ts';

export const messages = defineMessages({
  navigation: {
    additionalInformation: 'Additional information',
  },
  languageSelector: {
    switchLanguage: 'Change language',
    interfaceOnly: 'Interface only',
  },
  labels: {
    contact: 'Contact',
    contract: 'Contract',
    period: 'Period',
    duration: 'Duration',
    missions: 'Projects',
    client: 'Client',
    status: 'Status',
    employer: 'Employer',
    version: 'Version',
  },
  contract: {
    freelance: 'Freelance',
    permanent: 'Permanent',
  },
  missionStatus: {
    current: 'In progress',
    delivered: 'Delivered',
  },
  dates: {
    present: 'Present',
  },
  counts: {
    employer: {
      one: '{count} employer',
      other: '{count} employers',
    },
    year: {
      one: '{count} year',
      other: '{count} years',
    },
    month: {
      one: '{count} month',
      other: '{count} months',
    },
    mission: {
      one: '{count} project',
      other: '{count} projects',
    },
    version: {
      one: '{count} version',
      other: '{count} versions',
    },
  },
  accessibility: {
    missionStack: 'Stack: {mission}',
  },
  punctuation: {
    labelColon: ':',
  },
  print: {
    contactDetails: 'Contact details',
    experienceAndClientProjects: 'Experience & client projects',
    client: 'Client',
    environment: 'Environment',
    footer: 'Generated from mohsanaziz.github.io · {version} — page',
  },
});

export const cv = {
  metadata: {
    pageTitle: 'CV — Mohsan AZIZ',
    pageDescription: 'Mohsan AZIZ — Freelance Angular/Java Developer',
    printablePageTitle: 'Mohsan AZIZ — Printable CV',
  },
  profile: {
    imageAlt: 'Portrait of Mohsan AZIZ',
    jobTitle: 'Freelance Angular/Java Developer',
    contactDetails: {
      phone: {
        title: 'Phone',
      },
      email: {
        title: 'Email',
      },
      location: {
        title: 'Location',
        info: 'Paris, France',
      },
      birthdate: {
        title: 'Date of birth',
        info: '19 October 1989',
      },
    },
    resume: {
      text: 'PDF version',
    },
  },
  institutions: {
    frenchMinistryOfJustice: 'French Ministry of Justice',
  },
  about: {
    title: 'Profile',
    paragraphs: [
      'Freelance Angular/Java developer specialising in Angular, with experience redesigning and developing complex information systems across the justice, public administration and retail sectors.',
      'Recent work includes redesigning the Point P in-store application, which manages orders and quotations and integrates with external systems, including SAP ERP, through APIs. It combines Java back-end microservices with a monolithic Angular front end, using Bootstrap and NgRx for state management.',
      'I have also delivered major criminal justice and case management systems using Java (Spring Boot) and Angular, with microservices-based back ends and monolithic front ends. I am comfortable working in Agile (Scrum) environments within cross-functional teams, collaborating with Product Owners, project managers and domain experts.',
      'I value code quality and efficient development practices. I am seeking new challenges where I can apply my technical expertise, particularly in Angular.',
    ],
  },
  professionalExperience: {
    title: 'Professional experience',
    entries: {
      azmopak: {
        jobTitle: 'Freelance Angular/Java Developer',
      },
      sopraSteria: {
        jobTitle: 'Angular/Java Developer',
      },
    },
  },
  clientProjects: {
    title: 'Client projects',
    entries: {
      atlasIhm: {
        description: [
          'Redesign of the Point P in-store application for creating quotations and orders and managing multi-supplier orders.',
          'The Java back-end microservices integrate with external systems, including SAP ERP, through APIs. The Angular front end is monolithic and uses Bootstrap and NgRx for state management.',
          'The project team is organised around two tech leads, each overseeing seven developers, with a project manager coordinating the whole team. The project follows a hybrid Agile delivery model.',
        ],
      },
      sps: {
        description: [
          'Redesign of a criminal case management system used to store documents for cases under investigation.',
          'The solution combines an Angular web front end with a Java (Spring Boot) back end. A Spring Batch data migration transferred records from the legacy system.',
          'Delivered using Agile (Scrum) by a team of around ten developers, a domain expert, a Product Owner and a Project Manager.',
        ],
      },
      siaj: {
        description: [
          'Redesign of the legal aid information system to streamline online applications.',
          'The solution comprises a public-facing portal and an intranet back-office application. The Java back office uses a microservices architecture, while the Angular portal is monolithic; they exchange data through the ActiveMQ message broker.',
          'Delivered using Agile (Scrum) by around twelve developers, three domain experts, five Product Owners and a Project Manager.',
        ],
      },
      parcours: {
        description: [
          'Redesign of software used to track young people from entry into the justice system until discharge or adulthood.',
          'Three Agile (Scrum) teams delivered the project: two feature teams and one data migration team. Each feature team included one senior and three junior developers; a project lead and Scrum Master coordinated the teams, supported by five Product Owners and a Project Manager.',
          'The Java back end comprised four microservices, including an API gateway; the Angular front end used a monolithic architecture.',
        ],
      },
      ims: {
        description: [
          'Development of a scratch-card game management application.',
          'Delivered by an Agile (Scrum) team comprising a Product Owner and three developers, including a technical lead, coordinated by a project lead.',
          'The application used a monolithic architecture, with a Java back end and an Angular front end.',
        ],
      },
      portalisV3: {
        description: [
          'Redesign of case management software for French employment tribunals.',
          'Six Agile (Scrum) teams contributed: three feature teams; one cross-functional integration and UX/UI team; one architecture and technical leadership team; and one team of Product Owners. Each feature team had a senior or lead developer, five developers, a domain expert and a dedicated Product Owner. A project lead coordinated all teams, with a Scrum Master for each feature team.',
          'The Java back end used around fifteen microservices, including an API gateway; the Angular front end used a monolithic architecture.',
        ],
      },
    },
  },
} as const satisfies LocaleCv;
