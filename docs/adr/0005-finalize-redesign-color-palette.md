# ADR 0005 — Finaliser la palette de refonte sans compatibilités héritées

- Statut : accepté
- Date : 2026-08-19

## Contexte

L’[ADR 0002](0002-css-theme-tokens.md) a établi la méthode de gestion du thème : des tokens sémantiques déclarés dans le bloc `@theme`, les branches claire et sombre d’un rôle réunies dans `light-dark()`, et la préférence du système suivie sans JavaScript grâce à `color-scheme: light dark`. Il a aussi gelé plusieurs choix de compatibilité afin de préserver le rendu historique, tout en prévoyant leur réévaluation lorsqu’un changement autoriserait explicitement la rupture de cette parité.

La refonte décrite par l’issue [#34](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/34) constitue ce changement. L’[ADR 0004](0004-normalize-redesign-color-palette.md) a préparé la migration en introduisant la nouvelle palette à côté des tokens historiques. Toutes les régions utilisent désormais cette palette et l’issue [#38](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/38) a retiré les derniers composants et tokens hérités. Maintenir les anciennes compatibilités n’a donc plus de rendu à protéger.

## Décision

La méthode de l’ADR 0002 est intégralement conservée : `src/styles/main.css` reste la source de vérité, les tokens publics gardent des noms sémantiques dans `@theme`, leurs valeurs claire et sombre restent côte à côte dans `light-dark()`, et le thème continue de suivre la préférence du système par `color-scheme`, sans JavaScript.

Seuls ses choix de compatibilité sont révisés. La palette active est volontairement asymétrique : « Encre », composée de neutres légèrement chauds et d’un bleu encre, en thème clair ; « Monochrome », composée de neutres froids et sans accent décoratif, en thème sombre.

| Rôle          | Token                    | Encre — clair | Monochrome — sombre |
| ------------- | ------------------------ | ------------- | ------------------- |
| Fond          | `--color-page`           | `#fffefb`     | `#0f0f11`           |
| Panneau       | `--color-panel`          | `#f5f3ee`     | `#18181b`           |
| Bordure       | `--color-frame-border`   | `#d8d3c8`     | `#3a3a40`           |
| Filet         | `--color-rule`           | `#ebe8e0`     | `#232327`           |
| Texte         | `--color-copy`           | `#1c1a17`     | `#f4f4f5`           |
| Texte atténué | `--color-copy-muted`     | `#5c574e`     | `#a1a1ab`           |
| Lien          | `--color-link`           | `#12507e`     | `#f4f4f5`           |
| Soulignement  | `--color-link-underline` | `transparent` | `#f4f4f5`           |
| Focus         | `--color-focus`          | `#12507e`     | `#f4f4f5`           |
| État succès   | `--color-status-success` | `#2f6b34`     | `#4ade80`           |
| État CDI      | `--color-status-cdi`     | `#12507e`     | `#8ec5ff`           |

Le panneau sombre est plus clair que le fond sombre. L’échelle d’élévation suit ainsi la convention habituelle ; la luminance inversée que l’ADR 0002 imposait au thème sombre pour préserver l’ancien rendu est abandonnée.

Les trois compatibilités de rendu de l’ADR 0002 disparaissent avec cette obligation de parité :

- les variables `--legacy-*-rgb` et l’indirection des anciens tokens de survol, de texte atténué et de bordure sont retirées ;
- la surcharge globale `--opacity-30`, qui reproduisait l’alpha sérialisé de Tailwind CSS 3, est retirée avec le dernier usage qui en dépendait ;
- la valeur historique unique du filet est retirée et le token `--color-rule` possède désormais une branche propre à chaque thème.

Les couleurs d’état sont distinctes des couleurs d’accent décoratif. L’ADR 0002 interdit à un accent de porter une information parce que les accents historiques restaient sous un ratio de contraste de 3:1. Les puces `Freelance` et `CDI` ainsi que le badge de mission en cours transmettent une information ; ils utilisent donc les tokens dédiés `--color-status-success` et `--color-status-cdi`, dimensionnés pour le contraste. Le bleu sombre de `--color-status-cdi` reste en outre distinct du token `--color-link`, qui vaut la couleur du texte dans la palette Monochrome.

Pour cette même raison, les liens sont soulignés en thème sombre : leur couleur seule ne peut pas les distinguer du texte. Le token `--color-link-underline` porte cette variation dans `light-dark()` plutôt qu’une règle de thème dupliquée.

Les puces d’état utilisent un fond teinté à 14 % de leur couleur d’état, une bordure à 45 % et un texte à la couleur d’état pleine. Cette construction répond au seul défaut de contraste rencontré pendant le maquettage : une couleur d’état qui change de luminance entre les deux thèmes ne peut pas conserver la même couleur de texte dans les deux. Le fond teinté et le texte à la couleur pleine sont stables par construction, puisque le fond dérive de la couleur du texte.

Les ratios WCAG mesurés sur cette construction servent de valeurs de référence à toute évolution ultérieure :

| Couple                    | Clair | Sombre |
| ------------------------- | ----: | -----: |
| Texte / fond              | 17,22 |  17,42 |
| Texte atténué / panneau   |  6,47 |   6,92 |
| Lien / fond               |  8,41 |  17,42 |
| Puce Freelance            |  5,18 |   8,49 |
| Puce CDI                  |  6,71 |   8,19 |
| Badge de mission en cours |  5,18 |   8,49 |

La valeur la plus basse est celle de la puce verte en thème clair, à 5,18. Toute modification du vert clair `--color-status-success` doit donc remesurer ce couple en priorité.

## Conséquences

- La couche de style n’a plus à reproduire le rendu antérieur : les nouvelles valeurs se jugent selon leur rôle, la cohérence de la palette et leur contraste.
- Les tokens d’état ne doivent pas être remplacés par un accent décoratif ni par le token de lien, même lorsqu’une valeur claire leur est commune.
- Toute retouche de palette doit remesurer les couples affectés en prenant le tableau ci-dessus comme référence ; une modification de `--color-status-success` clair commence par la puce verte.
- Le site continue de suivre la préférence claire ou sombre du système sans JavaScript.
- Comme le prévoit l’ADR 0002, un futur sélecteur de thème ne dupliquera ni les tokens ni les utilitaires : la couche de style forcera seulement `color-scheme` sur l’élément racine, par exemple avec `:root[data-theme='light'] { color-scheme: light; }` et `:root[data-theme='dark'] { color-scheme: dark; }`. Une éventuelle logique cliente ne servira qu’à choisir et mémoriser cet attribut.
- Les contrôles natifs continueront de suivre le thème sélectionné grâce à `color-scheme`.
- L’ADR 0004 reste l’historique de la migration progressive ; ses dispositions temporaires sur la coexistence des deux familles de tokens sont désormais closes.
