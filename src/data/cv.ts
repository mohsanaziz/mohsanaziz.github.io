export type CvIconName = 'cake' | 'github' | 'linkedin' | 'location' | 'mail' | 'pdf' | 'phone';

interface CvLink {
  href: string;
  label: string;
  icon: CvIconName;
}

interface ContactDetail {
  title: string;
  info: string;
  icon: CvIconName;
}

interface CareerEntry {
  title: string;
  subtitle: string;
  date: string;
}

interface ClientProject extends CareerEntry {
  technologies: readonly string[];
  description: readonly string[];
}

interface CvData {
  pageTitle: string;
  profile: {
    image: {
      src: string;
      alt: string;
      width: number;
      height: number;
    };
    name: string;
    jobTitle: string;
    socialLinks: readonly CvLink[];
    contactDetails: readonly ContactDetail[];
    resume: CvLink & { text: string };
  };
  about: {
    title: string;
    paragraphs: readonly string[];
  };
  professionalExperience: {
    title: string;
    entries: readonly CareerEntry[];
  };
  clientProjects: {
    title: string;
    entries: readonly ClientProject[];
  };
}

export const cv = {
  pageTitle: 'CV - Mohsan AZIZ',
  profile: {
    image: {
      src: '/images/photo.jpg',
      alt: 'profil picture',
      width: 3840,
      height: 3840,
    },
    name: 'Mohsan AZIZ',
    jobTitle: 'Développeur freelance Angular/Java',
    socialLinks: [
      {
        href: 'https://github.com/mohsanaziz',
        label: 'github',
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
        title: 'Téléphone',
        info: '06.28.74.61.76',
        icon: 'phone',
      },
      {
        title: 'Email',
        info: 'mohsan.aziz@gmail.com',
        icon: 'mail',
      },
      {
        title: 'Location',
        info: 'Paris, France',
        icon: 'location',
      },
      {
        title: 'Date de naissance',
        info: '19 Octobre 1989',
        icon: 'cake',
      },
    ],
    resume: {
      href: '/cv/CV.pdf',
      label: 'CV',
      text: 'Version PDF',
      icon: 'pdf',
    },
  },
  about: {
    title: 'A propos',
    paragraphs: [
      "Je suis Mohsan AZIZ, développeur freelance spécialisé en Angular et Java, avec une expertise particulière en Angular. Au fil de mes projets, j'ai participé à la refonte et au développement de systèmes d'information complexes, couvrant des domaines variés comme les systèmes judiciaires, administratifs et le secteur commercial.",
      "L'un de mes projets récents inclut la refonte de l'application des magasins Point P, une solution permettant la gestion de commandes et de devis, avec une intégration à l'ERP SAP via des API externes. Ce projet reposait sur une architecture microservices en Java pour le back-end et une architecture monolithique en Angular pour le front-end, utilisant Bootstrap et NgRx pour la gestion de l'état.",
      "J'ai également travaillé sur des projets majeurs, tels que la refonte de systèmes de gestion pénale et judiciaire, en utilisant des technologies comme Java (Spring Boot) et Angular, dans des architectures microservices et monolithiques. Je suis habitué à évoluer dans des environnements Agile (SCRUM), au sein d'équipes pluridisciplinaires, et à collaborer avec des Product Owners, chefs de projet, et experts fonctionnels.",
      "Je mets un point d'honneur à la qualité du code, à l'optimisation des processus de développement, et je suis toujours en quête de nouveaux défis où je peux apporter mon expertise technique, particulièrement en Angular.",
    ],
  },
  professionalExperience: {
    title: 'Expérience professionnelle',
    entries: [
      {
        title: 'SASU AZMOPAK',
        subtitle: 'Développeur freelance Angular/Java',
        date: "Novembre 2019 - Aujourd'hui",
      },
      {
        title: 'Sopra Steria',
        subtitle: 'Développeur Angular/Java',
        date: 'Mai 2016 - Septembre 2019',
      },
    ],
  },
  clientProjects: {
    title: 'Projet client',
    entries: [
      {
        title: 'ATLAS IHM',
        subtitle: 'Saint-Gobain',
        date: "Septembre 2022 - Aujourd'hui",
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
        description: [
          "Projet de refonte de l'application des magasins Point P, visant à permettre la création de commandes et de devis, ainsi que la gestion des commandes auprès de divers fournisseurs.",
          "L'application est développée en Java pour le back-end, reposant sur une architecture microservices, qui communique avec des API externes, notamment l'ERP SAP. Le front-end, écrit en Angular, suit une architecture monolithique et utilise Bootstrap ainsi que NgRx pour la gestion de l'état.",
          "L'équipe projet est composée de deux tech leads, chacun supervisant sept développeurs, et l'ensemble est coordonné par un chef de projet. La gestion du projet est basée sur une méthodologie semi Agile.",
        ],
      },
      {
        title: 'SPS',
        subtitle: 'Ministère de la Justice',
        date: 'Mars 2022 - Juin 2022',
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
        description: [
          "Projet de refonte du système de gestion pénale destiné à stocker des documents relatifs aux affaires en cours d'instruction.",
          "Le projet comportait une dimension fonctionnelle avec une application web en front-end développée en Angular et une partie back-end réalisée en Java (Spring Boot). Une phase de reprise des données a également été mise en œuvre pour migrer les informations de l'ancienne application vers la nouvelle, à l'aide de Spring Batch.",
          "Le projet a été conduit selon la méthodologie Agile (SCRUM), avec une équipe composée d'une dizaine de développeurs, d'un expert fonctionnel, d'un Product Owner (PO) et d'un Project Manager (PM).",
        ],
      },
      {
        title: 'SIAJ',
        subtitle: 'Ministère de la Justice',
        date: 'Octobre 2020 - Décembre 2021',
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
        description: [
          "Projet de refonte du système d'information de l'aide juridictionnelle visant à simplifier la soumission des demandes en ligne.",
          "Le projet comprend deux volets : une partie front-office (internet) et une partie back-office (intranet). La partie back-office est développée avec une architecture en microservices (Java), tandis que la partie front-office repose sur une architecture monolithique (Angular). Ces deux composants communiquent via un broker de messages (ActiveMQ) pour l'échange de données.",
          "La gestion du projet a été effectuée selon la méthodologie Agile (SCRUM), avec une équipe composée d'une douzaine de développeurs, de trois experts fonctionnels, de cinq Product Owners (PO) et d'un Project Manager (PM).",
        ],
      },
      {
        title: 'PARCOURS',
        subtitle: 'Ministère de la Justice',
        date: 'Février 2020 - Mai 2020',
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
        description: [
          "Projet de refonte du logiciel de suivi des jeunes pris en charge par le système judiciaire, depuis leur entrée jusqu'à leur sortie ou leur majorité.",
          "Le projet a été géré selon la méthodologie Agile (SCRUM) au niveau des équipes de développement. Il comprenait trois équipes : deux dédiées au développement des nouvelles fonctionnalités et une consacrée à la reprise des données. Chaque équipe de développement était composée d'un développeur senior et de trois développeurs juniors. L'ensemble des équipes était supervisé par un chef de projet et un SCRUM Master. Le projet incluait également une équipe de cinq Product Owners (PO) et un Project Manager (PM).",
          "Sur le plan technique, l'architecture du projet reposait sur des microservices pour la partie back-end (Java) et une architecture monolithique pour la partie front-end (Angular). Quatre services, dont une passerelle (gateway), étaient mis en place pour la partie back-end.",
        ],
      },
      {
        title: 'IMS',
        subtitle: 'Française des Jeux - Gaming Solution (FDJ-GS)',
        date: 'Novembre 2019 - Décembre 2019',
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
        description: [
          "Projet de développement d'une application de gestion des jeux à gratter.",
          "Le projet mobilisait une équipe composée de trois développeurs (deux développeurs et un référent technique) ainsi que d'une Product Owner (PO), sous la supervision d'un chef de projet. La gestion du projet s'appuyait sur la méthodologie Agile (SCRUM).",
          "Sur le plan technique, l'application était conçue sous une architecture monolithique, avec une partie back-end en Java et une partie front-end en Angular.",
        ],
      },
      {
        title: 'PORTALIS V3',
        subtitle: 'Ministère de la Justice',
        date: 'Avril 2018 - Septembre 2019',
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
        description: [
          'Projet de refonte du logiciel des conseils de prud’hommes.',
          "Le projet était géré selon la méthodologie Agile (SCRUM) au sein des équipes de développement. Il comprenait six équipes distinctes : trois équipes dédiées au développement des fonctionnalités, une équipe transverse (incluant des intégrateurs, des UX/UI designers, etc.), une équipe d'architectes et de référents techniques, ainsi qu'une équipe de Product Owners (PO). Chaque équipe de développement était composée d'un développeur senior/référent, de cinq développeurs, et d'un expert fonctionnel, avec un PO attitré par équipe. L'ensemble des équipes était coordonné par un chef de projet, avec un SCRUM Master pour chaque équipe de développement.",
          "Sur le plan technique, l'architecture du projet reposait sur des microservices pour la partie back-end (Java) et une architecture monolithique pour la partie front-end (Angular). Le back-end comprenait une quinzaine de services, incluant une passerelle (gateway).",
        ],
      },
    ],
  },
} as const satisfies CvData;
