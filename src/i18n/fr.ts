import type { LocaleCv } from './content.ts';
import { defineMessages } from './messages.ts';

// French locale layer. Its shape mirrors `en.ts` key for key: French is a locale like any other, and the
// GitHub shell vocabulary (README.md, Public, Releases, Latest, Languages, Contributors, Stack, Summary)
// is quoted from the GitHub interface, so it stays in English and out of this store.

export const messages = defineMessages({
  navigation: {
    additionalInformation: 'Informations complémentaires',
  },
  languageSelector: {
    switchLanguage: 'Changer de langue',
    interfaceOnly: 'Interface uniquement',
  },
  labels: {
    contact: 'Contact',
    contract: 'Contrat',
    period: 'Période',
    duration: 'Durée',
    missions: 'Missions',
    client: 'Client',
    status: 'Statut',
    employer: 'Employeur',
    version: 'Version',
  },
  contract: {
    freelance: 'Freelance',
    permanent: 'CDI',
  },
  missionStatus: {
    current: 'En cours',
    delivered: 'Livrée',
  },
  dates: {
    present: "Aujourd'hui",
  },
  counts: {
    employer: {
      one: '{count} employeur',
      other: '{count} employeurs',
    },
    year: {
      one: '{count} an',
      other: '{count} ans',
    },
    month: {
      one: '{count} mois',
      other: '{count} mois',
    },
    mission: {
      one: '{count} mission',
      other: '{count} missions',
    },
    version: {
      one: '{count} version',
      other: '{count} versions',
    },
  },
  accessibility: {
    missionStack: 'Stack\u00A0: {mission}',
  },
  punctuation: {
    labelColon: '\u00A0:',
  },
  print: {
    contactDetails: 'Coordonnées',
    experienceAndClientProjects: 'Expérience & projets client',
    client: 'Client',
    environment: 'Environnement',
    footer: 'Généré depuis mohsanaziz.github.io · {version} — page',
  },
});

export const cv = {
  metadata: {
    pageTitle: 'CV — Mohsan AZIZ',
    pageDescription: 'Mohsan AZIZ — Développeur freelance Angular/Java',
    printablePageTitle: 'Mohsan AZIZ — CV imprimable',
  },
  profile: {
    imageAlt: 'Photo de Mohsan AZIZ',
    jobTitle: 'Développeur freelance Angular/Java',
    contactDetails: {
      phone: {
        title: 'Téléphone',
      },
      email: {
        title: 'Email',
      },
      location: {
        title: 'Localisation',
        info: 'Paris, France',
      },
      birthdate: {
        title: 'Date de naissance',
        info: '19 Octobre 1989',
      },
    },
    resume: {
      text: 'Version PDF',
    },
  },
  institutions: {
    frenchMinistryOfJustice: 'Ministère de la Justice',
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
    entries: {
      azmopak: {
        jobTitle: 'Développeur freelance Angular/Java',
      },
      sopraSteria: {
        jobTitle: 'Développeur Angular/Java',
      },
    },
  },
  clientProjects: {
    title: 'Projet client',
    entries: {
      atlasIhm: {
        description: [
          "Projet de refonte de l'application des magasins Point P, visant à permettre la création de commandes et de devis, ainsi que la gestion des commandes auprès de divers fournisseurs.",
          "L'application est développée en Java pour le back-end, reposant sur une architecture microservices, qui communique avec des API externes, notamment l'ERP SAP. Le front-end, écrit en Angular, suit une architecture monolithique et utilise Bootstrap ainsi que NgRx pour la gestion de l'état.",
          "L'équipe projet est composée de deux tech leads, chacun supervisant sept développeurs, et l'ensemble est coordonné par un chef de projet. La gestion du projet est basée sur une méthodologie semi Agile.",
        ],
      },
      sps: {
        description: [
          "Projet de refonte du système de gestion pénale destiné à stocker des documents relatifs aux affaires en cours d'instruction.",
          "Le projet comportait une dimension fonctionnelle avec une application web en front-end développée en Angular et une partie back-end réalisée en Java (Spring Boot). Une phase de reprise des données a également été mise en œuvre pour migrer les informations de l'ancienne application vers la nouvelle, à l'aide de Spring Batch.",
          "Le projet a été conduit selon la méthodologie Agile (SCRUM), avec une équipe composée d'une dizaine de développeurs, d'un expert fonctionnel, d'un Product Owner (PO) et d'un Project Manager (PM).",
        ],
      },
      siaj: {
        description: [
          "Projet de refonte du système d'information de l'aide juridictionnelle visant à simplifier la soumission des demandes en ligne.",
          "Le projet comprend deux volets : une partie front-office (internet) et une partie back-office (intranet). La partie back-office est développée avec une architecture en microservices (Java), tandis que la partie front-office repose sur une architecture monolithique (Angular). Ces deux composants communiquent via un broker de messages (ActiveMQ) pour l'échange de données.",
          "La gestion du projet a été effectuée selon la méthodologie Agile (SCRUM), avec une équipe composée d'une douzaine de développeurs, de trois experts fonctionnels, de cinq Product Owners (PO) et d'un Project Manager (PM).",
        ],
      },
      parcours: {
        description: [
          "Projet de refonte du logiciel de suivi des jeunes pris en charge par le système judiciaire, depuis leur entrée jusqu'à leur sortie ou leur majorité.",
          "Le projet a été géré selon la méthodologie Agile (SCRUM) au niveau des équipes de développement. Il comprenait trois équipes : deux dédiées au développement des nouvelles fonctionnalités et une consacrée à la reprise des données. Chaque équipe de développement était composée d'un développeur senior et de trois développeurs juniors. L'ensemble des équipes était supervisé par un chef de projet et un SCRUM Master. Le projet incluait également une équipe de cinq Product Owners (PO) et un Project Manager (PM).",
          "Sur le plan technique, l'architecture du projet reposait sur des microservices pour la partie back-end (Java) et une architecture monolithique pour la partie front-end (Angular). Quatre services, dont une passerelle (gateway), étaient mis en place pour la partie back-end.",
        ],
      },
      ims: {
        description: [
          "Projet de développement d'une application de gestion des jeux à gratter.",
          "Le projet mobilisait une équipe composée de trois développeurs (deux développeurs et un référent technique) ainsi que d'une Product Owner (PO), sous la supervision d'un chef de projet. La gestion du projet s'appuyait sur la méthodologie Agile (SCRUM).",
          "Sur le plan technique, l'application était conçue sous une architecture monolithique, avec une partie back-end en Java et une partie front-end en Angular.",
        ],
      },
      portalisV3: {
        description: [
          'Projet de refonte du logiciel des conseils de prud’hommes.',
          "Le projet était géré selon la méthodologie Agile (SCRUM) au sein des équipes de développement. Il comprenait six équipes distinctes : trois équipes dédiées au développement des fonctionnalités, une équipe transverse (incluant des intégrateurs, des UX/UI designers, etc.), une équipe d'architectes et de référents techniques, ainsi qu'une équipe de Product Owners (PO). Chaque équipe de développement était composée d'un développeur senior/référent, de cinq développeurs, et d'un expert fonctionnel, avec un PO attitré par équipe. L'ensemble des équipes était coordonné par un chef de projet, avec un SCRUM Master pour chaque équipe de développement.",
          "Sur le plan technique, l'architecture du projet reposait sur des microservices pour la partie back-end (Java) et une architecture monolithique pour la partie front-end (Angular). Le back-end comprenait une quinzaine de services, incluant une passerelle (gateway).",
        ],
      },
    },
  },
} as const satisfies LocaleCv;
