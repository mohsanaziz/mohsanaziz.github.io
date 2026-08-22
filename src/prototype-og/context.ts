// PROTOTYPE — jetable. Issue #82. Voir src/prototype-og/README.md.
//
// Quatre compositions de carte 1200×630, sélectionnées par le chemin
// `/prototype-og/<variante>/<locale>/`. Astro retire les paramètres de recherche en sortie
// statique : la bascule passe donc par l'URL et non par `?variant=`. Aucun état global —
// chaque composant appelle `prototypeOg(Astro.url)`.
//
// #81 a tranché le mécanisme : une carte par locale, générée au build par le Chromium déjà
// présent, route `[...locale]/og-card.astro` en noindex, artefacts sous `/og/`. Reste
// l'allure — c'est le seul axe que ce prototype fait varier.

import { CARD_LANGS, isCardLang, type CardLang } from '@/prototype-og/content';

export type VariantKey = 'A' | 'B' | 'C' | 'D';

export const VARIANT_KEYS = ['A', 'B', 'C', 'D'] as const satisfies readonly VariantKey[];

export type CardTheme = 'light' | 'dark';

export const CARD_THEMES = ['light', 'dark'] as const satisfies readonly CardTheme[];

export interface Variant {
  key: VariantKey;
  name: string;
  summary: string;
  /** Ce que la variante met à l'épreuve, et ce qu'elle risque de perdre. */
  stake: string;
  photo: 'aucune' | 'pastille' | 'pleine hauteur';
  /** Ce qui domine la carte à la première seconde. */
  headline: 'nom' | 'intitulé' | 'la page';
}

const VARIANTS: Record<VariantKey, Variant> = {
  A: {
    key: 'A',
    name: 'Le haut de page',
    summary:
      'La reprise littérale : en-tête du dépôt, cadre README.md, titre h1, sous-titre, début du « À propos ». L’échelle du site, recadrée à 1200×630.',
    stake:
      'L’hypothèse que le ticket demande d’éprouver. Une carte lue en vignette n’est pas une page lue à l’écran : le h1 du site fait 36 px, soit 10 px dans un fil mobile.',
    photo: 'pastille',
    headline: 'la page',
  },
  B: {
    key: 'B',
    name: 'Portrait',
    summary: 'La photo à fond perdu sur toute la hauteur, côté départ ; le nom en 104 px face à elle. Aucune coquille GitHub.',
    stake:
      'Le maximum de lisibilité en vignette, au prix de la métaphore du dépôt — qui est l’identité visuelle du site. Un visage réduit à 40 px est-il encore un visage ?',
    photo: 'pleine hauteur',
    headline: 'nom',
  },
  C: {
    key: 'C',
    name: 'Dépôt',
    summary:
      'La coquille réduite à une signature : une barre « mohsanaziz / cv » et sa pastille Public, le nom monumental au centre, l’avatar en pastille au pied.',
    stake: 'Garder la métaphore sans la payer en surface. Deux hiérarchies se disputent le regard — la barre du dépôt et le nom.',
    photo: 'pastille',
    headline: 'nom',
  },
  D: {
    key: 'D',
    name: 'Métier d’abord',
    summary:
      'Hiérarchie inversée : l’intitulé de poste en titre, sur trois lignes serrées ; le nom en second, sous un filet. Aucune photo.',
    stake:
      'Ce qu’un lien de CV vend est peut-être le métier, pas le nom. Sur la carte arabe sans intitulé, la variante n’a plus de titre : le nom remonte, et D se dissout en un C sans photo. C’est là qu’elle se juge.',
    photo: 'aucune',
    headline: 'intitulé',
  },
};

export const VARIANT_LIST = VARIANT_KEYS.map((key) => VARIANTS[key]);

export const PROTOTYPE_ROUTE_PREFIX = 'prototype-og';

export function harnessHref(variant: VariantKey, lang: CardLang): string {
  return `/${PROTOTYPE_ROUTE_PREFIX}/${variant}/${lang}/`;
}

export function cardHref(variant: VariantKey, lang: CardLang, theme: CardTheme): string {
  return `/${PROTOTYPE_ROUTE_PREFIX}/card/${variant}/${lang}/${theme}/`;
}

export function variantOf(value: string | undefined): Variant {
  return value !== undefined && value in VARIANTS ? VARIANTS[value as VariantKey] : VARIANTS.A;
}

export interface PrototypeOgContext {
  variant: Variant;
  lang: CardLang;
}

/** Lit `/prototype-og/<variante>/<locale>/`. Hors de ce préfixe : A + français. */
export function prototypeOg(url: URL): PrototypeOgContext {
  const [prefix, variantParam, langParam] = url.pathname.split('/').filter(Boolean);
  const onPrototypeRoute = prefix === PROTOTYPE_ROUTE_PREFIX;

  return {
    variant: variantOf(onPrototypeRoute ? variantParam : undefined),
    lang: onPrototypeRoute && isCardLang(langParam) ? langParam : 'fr',
  };
}

export { CARD_LANGS };
export type { CardLang };
