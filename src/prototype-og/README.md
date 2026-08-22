# Prototype #82 — allure de la carte Open Graph, trois locales

> **Code jetable.** Rien ici n'est destiné à `main`. Le livrable est la décision, pas ce code.
> Voir [#82](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/82), carte [#60](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/60).

## La question

> À quoi ressemble la carte 1200×630 qu'un lien partagé affiche, dans les trois locales ?

Le mécanisme est déjà tranché par [#81](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/81) — une carte par
locale, générée au build par le Chromium déjà présent, route `[...locale]/og-card.astro` en `noindex`, artefacts sous
`/og/`. **Le seul axe que ce prototype fait varier, c'est l'allure.**

## Le plan

Quatre compositions, quatre locales, commutables depuis une barre flottante. Astro retire les paramètres de recherche en
sortie statique : la bascule passe donc par le chemin, `/prototype-og/<composition>/<locale>/`, et non par `?variant=`.

Deux routes plutôt qu'une, parce que la carte n'est pas une page :

| Route                                         | Ce qu'elle sert                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/prototype-og/card/<comp>/<locale>/<thème>/` | **La carte nue.** 1200×630 et rien autour — la forme qu'aurait `og-card.astro`, et ce que le script de capture ouvre.   |
| `/prototype-og/<comp>/<locale>/`              | **L'écran de contrôle.** La même carte, vue dans les conditions où elle est réellement jugée. C'est la page à regarder. |

L'écran de contrôle ne redessine jamais la carte : il la rend toujours à 1200×630 puis la réduit par `transform: scale()`.
Une carte redessinée à 340 px mentirait sur ce que Chromium capturera.

## Lancer

```sh
npm run prototype:og
```

Puis <http://localhost:4321/prototype-og/A/fr/>. `←` `→` changent de composition, `↑` `↓` de locale. La barre n'est
rendue qu'en dev.

Les 32 cartes nues et les 16 écrans de contrôle : `node scripts/prototype-og-shots.mjs` → `tmp/prototype-og/`. Le script
capture les cartes en viewport 1200×630 à `deviceScaleFactor: 1`, c'est-à-dire exactement comme le ferait la génération
au build.

## Les quatre compositions

| Clé   | Forme           | Photo          | Ce qui domine | Ce qu'elle met à l'épreuve                                                                                                                     |
| ----- | --------------- | -------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | Le haut de page | pastille       | la page       | La reprise littérale, que le ticket demande d'éprouver. Rien n'est grossi pour la vignette : le h1 du site fait 36 px, soit 10 px dans un fil. |
| **B** | Portrait        | pleine hauteur | nom           | Le maximum de lisibilité, au prix de la métaphore du dépôt — qui est l'identité visuelle du site.                                              |
| **C** | Dépôt           | pastille       | nom           | Garder la coquille sans la payer en surface : une barre en tête, une pastille au pied, le nom entre les deux.                                  |
| **D** | Métier d'abord  | aucune         | intitulé      | Hiérarchie inversée : l'intitulé en titre, le nom sous un filet. Un lien de CV se vend peut-être sur le métier.                                |

Elles ne partagent que `content.ts` et l'aiguilleur `OgCard.astro`. Aucune mise en page commune : chacune pose sa propre
racine 1200×630 et fait ce qu'elle veut de la surface — c'est précisément là-dessus qu'elles doivent avoir le droit de
diverger.

## Les quatre locales

Le ticket parle de trois locales ; le prototype en montre quatre, parce que l'arabe pose **deux** questions et non une.

| Clé       | Contenu                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fr`      | Témoin. Locale par défaut, servie à la racine ([#62](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/62)).                             |
| `en`      | Locale complète, contenu compris ([#63](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/63)). L'intitulé y est le plus long des trois. |
| `ar`      | Interface arabe, **intitulé français rendu tel quel** — le repli de #63, montré en face.                                                         |
| `ar-sans` | Même carte, **sans intitulé du tout** : la carte arabe se tait plutôt que de montrer du français.                                                |

`ar` et `ar-sans` ne sont pas deux locales, ce sont **deux réponses possibles à la même question**, celle que le ticket
pose : « la carte arabe montre-t-elle un intitulé français, ou l'évite-t-elle ? » Les quatre compositions doivent tenir
dans les deux cas, sinon ce n'est pas une composition, c'est un gabarit chanceux. C'est aussi la seule case du prototype
où le repli ne gêne pas une composition mais la dissout : sans intitulé, D n'a plus de titre, le nom remonte, et D
devient un C sans photo.

## Ce que l'écran de contrôle montre

1. **Pleine taille, les deux thèmes.** Les jetons du site sont des `light-dark()` (ADR 0002) : le thème est porté par
   `color-scheme` sur la racine de la carte, sans dupliquer une palette. La question qui en découle est de savoir
   **lequel des deux on fige au build** — une carte est vue sur fond de plateforme, pas sur fond de site.
2. **En vignette.** 340 px (fil mobile), 240 px (aperçu de messagerie), 160 px (carte compacte), plus le 340 px sombre.
   C'est le test que le ticket appelle « celui qui compte ».
3. **Recadrage et zone de sécurité.** Marge de 5 %, rayon d'angle appliqué par la plateforme, et le carré central 1:1 —
   posé en gabarit sur la carte, puis réellement recadré à côté.
4. **Sur fond de plateforme.** Un fil clair à 552 px avec son bandeau de domaine, une bulle de messagerie sombre à 300 px.

## Ce dont le prototype hérite

| Décision                                                                    | Ce que le prototype en fait                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [#61](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/61) polices | Noto Sans Arabic v2.012, épinglée et vérifiée par SHA-256. Pas de nastaliq : le périmètre est passé à trois locales (#68).     |
| [#62](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/62) URLs    | `mohsanaziz.github.io` affichée telle quelle ; le prototype route par `/prototype-og/`, il n'annonce pas de locale dans l'URL. |
| [#63](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/63) données | Lexique GitHub anglais dans les trois locales (`README.md`, `Public`, `Releases`), nom translittéré avec le latin conservé.    |
| [#64](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/64) RTL     | `dir="rtl"` sur la racine, propriétés logiques, **aucun îlot `dir="ltr"`**, icônes jamais retournées.                          |
| [#81](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/81) OG      | Une carte par locale, générée au build, `noindex`. Le mécanisme n'est pas rejugé ici.                                          |

Deux points hérités qui se voient à l'œil sur les captures :

- **A en arabe** montre le mode d'échec du bidi mesuré en [#66](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/66) :
  le paragraphe français dans un bloc RTL voit son point final migrer en tête de la dernière ligne. Ce n'est pas un bug du
  prototype, c'est le rendu.
- **L'intitulé français dans une carte arabe** est posé avec `lang="fr"` mais **sans `dir`**, conformément à #64. Une
  ligne entièrement latine se compose bien en LTR, alignée au bord `end` ; c'est visible en B, C et D.

## Ce que le prototype ne décide pas

- **Le mécanisme.** Route, capture, chemin des artefacts, `og:image:width` : tranchés en #81.
- **Les balises.** `og:title`, `og:description`, `og:locale` et ses alternates : tranchés en #81, repris de la page.
- **Le contenu arabe lui-même.** La traduction est hors périmètre de la carte #60.
- **La police latine.** #61 remplace Satoshi ; le prototype garde Satoshi en `fr`/`en` et ne bascule le jeton qu'en
  arabe, comme #64 et #65 avant lui. La carte ne rejuge pas la police.

## Comment c'est câblé

| Fichier                                                      | Rôle                                                                                          |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `src/prototype-og/content.ts`                                | Ce que la carte a le droit de dire, locale par locale. Le point dur du ticket est ici.        |
| `src/prototype-og/context.ts`                                | Les quatre compositions et leur enjeu ; lecture du chemin. Sans état global, sans middleware. |
| `src/prototype-og/OgCard.astro`                              | L'aiguilleur : pose la racine 1200×630, la locale, la direction, le thème. Rien d'autre.      |
| `src/prototype-og/variants/*.astro`                          | Une composition par fichier, libre de sa mise en page.                                        |
| `src/prototype-og/prototype.css`                             | Police arabe (#61) et mécanique de mise à l'échelle de l'écran de contrôle.                   |
| `src/components/PrototypeOgSwitcher.astro`                   | Barre flottante, rendue uniquement en dev.                                                    |
| `src/pages/prototype-og/[variant]/[lang].astro`              | Les seize écrans de contrôle.                                                                 |
| `src/pages/prototype-og/card/[variant]/[lang]/[theme].astro` | Les trente-deux cartes nues.                                                                  |
| `scripts/prototype-og-fonts.mjs`                             | Télécharge et vérifie Noto Sans Arabic (asset de release épinglé, cf. #61).                   |
| `scripts/prototype-og-shots.mjs`                             | Capture les 32 cartes et les 16 écrans de contrôle.                                           |

Aucun composant existant n'est modifié : contrairement à #64 et #65, la carte ne se monte pas sur la page d'accueil,
elle est une surface à part. `Icon.astro`, `SectionFrame` et les jetons de `main.css` sont lus, jamais touchés.
