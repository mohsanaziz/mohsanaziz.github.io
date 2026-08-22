// PROTOTYPE — jetable. Issue #82. Voir src/prototype-og/README.md.
//
// Ce que la carte a le droit de dire, locale par locale. Ce n'est pas le modèle de #63 :
// c'est le strict nécessaire d'une carte 1200×630, extrait à la main du CV français et
// du calque anglais réel (`src/i18n/en.ts`), plus un calque arabe repris du prototype #65.
//
// Le point dur du ticket est ici, pas dans les composants : l'interface arabe est traduite,
// l'intitulé de poste ne l'est pas (#63). D'où deux entrées arabes plutôt qu'une —
// `ar` montre l'intitulé français tel quel, `ar-sans` s'en passe. La composition doit tenir
// dans les deux cas, sinon ce n'est pas une composition, c'est un gabarit chanceux.

import { cv } from '@/data/cv';
import { cv as enCv } from '@/i18n/en';

export type CardLang = 'fr' | 'en' | 'ar' | 'ar-sans';

export const CARD_LANGS = ['fr', 'en', 'ar', 'ar-sans'] as const satisfies readonly CardLang[];

export interface CardContent {
  /** Ce que porte `lang` sur la racine de la carte. */
  htmlLang: string;
  dir: 'ltr' | 'rtl';
  /** Étiquette de la locale dans la barre de bascule, en français. */
  label: string;
  /** Nom affiché. Translittéré en arabe (#63). */
  name: string;
  /** Doublure latine du nom, que #63 conserve en arabe. `null` hors arabe. */
  nameLatin: string | null;
  /** Intitulé de poste. `null` : la carte choisit de ne pas le dire. */
  jobTitle: string | null;
  /** `lang` à poser sur l'intitulé quand il retombe sur le français dans une page arabe. */
  jobTitleLang: string | null;
  location: string;
  /** Coquille GitHub. Le lexique reste anglais dans les trois locales (#63). */
  owner: string;
  repository: string;
  visibility: string;
  readme: string;
  /** Première phrase du « À propos », pour la variante qui reprend le haut de page. */
  intro: string;
  /** Titre de la section « À propos », traduit. */
  introTitle: string;
  /** URL affichée, jamais traduite. */
  url: string;
  /** Ce que le ticket demande de regarder en face, formulé pour l'écran de contrôle. */
  note: string;
}

const OWNER = 'mohsanaziz';
const URL_LABEL = 'mohsanaziz.github.io';

// Le lexique GitHub — README.md, Public — n'est traduit dans aucune locale (#63).
const SHELL = { owner: OWNER, repository: 'cv', visibility: 'Public', readme: 'README.md', url: URL_LABEL } as const;

const FRENCH_JOB_TITLE = cv.profile.jobTitle;

const CONTENT: Record<CardLang, CardContent> = {
  fr: {
    ...SHELL,
    htmlLang: 'fr',
    dir: 'ltr',
    label: 'Français',
    name: cv.profile.name,
    nameLatin: null,
    jobTitle: FRENCH_JOB_TITLE,
    jobTitleLang: null,
    location: 'Paris, France',
    introTitle: cv.about.title,
    intro: cv.about.paragraphs[0] ?? '',
    note: 'Témoin. Locale par défaut, servie à la racine (#62).',
  },
  en: {
    ...SHELL,
    htmlLang: 'en',
    dir: 'ltr',
    label: 'English',
    name: cv.profile.name,
    nameLatin: null,
    jobTitle: enCv.profile.jobTitle,
    jobTitleLang: null,
    location: 'Paris, France',
    introTitle: enCv.about.title,
    intro: enCv.about.paragraphs[0],
    note: 'Locale complète, contenu compris (#63). L’intitulé est le plus long des trois.',
  },
  ar: {
    ...SHELL,
    htmlLang: 'ar',
    dir: 'rtl',
    label: 'العربية — repli fr',
    name: 'محسن عزيز',
    nameLatin: cv.profile.name,
    // #63 : l'interface arabe est traduite, le contenu retombe sur le français, sans bandeau.
    jobTitle: FRENCH_JOB_TITLE,
    jobTitleLang: 'fr',
    location: 'باريس، فرنسا',
    introTitle: 'نبذة',
    intro: cv.about.paragraphs[0] ?? '',
    note: 'Interface arabe, intitulé français rendu tel quel. Aucun îlot dir="ltr" (#64) : le bidi place la ligne latine seul.',
  },
  'ar-sans': {
    ...SHELL,
    htmlLang: 'ar',
    dir: 'rtl',
    label: 'العربية — sans intitulé',
    name: 'محسن عزيز',
    nameLatin: cv.profile.name,
    jobTitle: null,
    jobTitleLang: null,
    location: 'باريس، فرنسا',
    introTitle: 'نبذة',
    intro: '',
    note: 'La carte arabe se tait plutôt que de montrer du français. Ce qui reste doit suffire — ou la variante tombe.',
  },
};

export function cardContent(lang: CardLang): CardContent {
  return CONTENT[lang];
}

export function isCardLang(value: string | null | undefined): value is CardLang {
  return value !== null && value !== undefined && (CARD_LANGS as readonly string[]).includes(value);
}
