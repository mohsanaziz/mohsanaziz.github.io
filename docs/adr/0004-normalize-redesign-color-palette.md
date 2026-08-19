# ADR 0004 — Normaliser l’échelle sombre de la palette de refonte

- Statut : accepté, partiellement remplacé par l’[ADR 0005](0005-finalize-redesign-color-palette.md)
- Date : 2026-08-19

## Amendement du 19 août 2026

L’issue [#38](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/38) clôt la coexistence des deux palettes après la migration de toutes les régions. Les formulations ci-dessous sur les tokens historiques conservés temporairement et le tableau de correspondance décrivent cette phase désormais achevée et sont gardées comme historique de la décision.

L’[ADR 0005](0005-finalize-redesign-color-palette.md) consigne la palette finale, ses valeurs de contraste de référence et la fin de la parité héritée. La feuille `src/styles/main.css` reste la source de vérité pour les valeurs actives.

## Contexte

L’[ADR 0002](0002-css-theme-tokens.md) a figé le rendu historique du CV pendant la migration vers Tailwind CSS. Sa palette sombre inverse volontairement l’échelle d’élévation : les surfaces élevées y sont plus sombres que le fond. Cette contrainte devait rester en vigueur jusqu’à une revue globale de la palette.

La refonte décrite par l’issue #34 constitue cette revue. Elle adopte la palette « Encre » en thème clair et « Monochrome » en thème sombre. Dans cette dernière, le panneau `#18181b` est plus clair que le fond `#0f0f11`, selon l’échelle d’élévation habituelle. Le premier ticket de la refonte introduit ces rôles à côté des tokens historiques afin que les régions puissent être migrées progressivement sans casser leur rendu.

## Décision

Tout code nouveau ou refondu utilise les tokens de la palette de refonte et son échelle sombre normalisée. La règle d’élévation sombre inversée de l’ADR 0002 ne s’applique plus qu’aux tokens historiques conservés temporairement pour les régions qui n’ont pas encore migré.

La correspondance de migration est la suivante :

| Rôle historique   | Rôle de refonte |
| ----------------- | --------------- |
| `surface`         | `page`          |
| `surface-overlay` | `panel`         |
| `foreground`      | `copy`          |
| `muted`           | `copy-muted`    |
| `border`          | `frame-border`  |
| `divider`         | `rule`          |

`surface-raised` n’a pas de successeur unique : chaque composant hérité choisit `page` ou `panel` selon son niveau dans la nouvelle structure. Les anciens accents ne deviennent pas des liens ou des états ; ces rôles reçoivent des tokens dédiés au moment de leur migration.

Les deux familles restent déclarées ensemble dans `src/styles/main.css` pendant la transition. Aucun nouveau composant ne doit utiliser un token historique. Les valeurs claire et sombre d’un rôle continuent d’être réunies dans une seule déclaration `light-dark()`, conformément à la méthode de l’ADR 0002.

## Conséquences

- La refonte peut avancer par régions tout en gardant la page publiable et le rendu historique intact ailleurs.
- Deux vocabulaires de couleur coexistent temporairement ; leur frontière est le statut migré ou non du composant.
- Les tickets suivants n’ont pas à redéduire la correspondance entre les palettes.
- L’issue [#38](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/38) termine la transition en supprimant les tokens historiques, leurs variables de compatibilité et cette période de coexistence.
- L’ADR 0002 reste la référence pour la déclaration CSS-first, `light-dark()` et `color-scheme`, mais sa convention d’élévation inversée est remplacée par la présente décision pour tout code refondu.
