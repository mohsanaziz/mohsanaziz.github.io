# ADR 0002 — Tokens de thème déclarés en CSS avec `light-dark()`

- Statut : accepté
- Date : 2026-08-17

## Contexte

La couche de style reposait sur Sass et contournait le système de thème de Tailwind. Un fichier réimplémentait manuellement des utilitaires de couleur que Tailwind sait générer, y compris leur variante d’opacité. Les couleurs d’accent étaient codées en dur dans ces règles plutôt que déclarées comme des tokens.

Le thème provenait en outre d’un modèle copié dont dix des dix-sept variables n’étaient jamais utilisées. Les valeurs restantes mélangeaient plusieurs notations de couleur incompatibles et leurs noms décrivaient mal leur rôle : le fond dit « tertiaire » était la surface la plus en avant, tandis que le token dit `input` ne servait qu’au survol des puces de compétences.

Le mode sombre était défini dans une media query qui redéclarait toutes les variables. Ajouter un sélecteur de thème aurait donc demandé de dupliquer à nouveau le thème. Sass n’apportait par ailleurs que le découpage en fichiers, l’imbrication de sélecteurs et un barrel d’imports, tous couverts par CSS natif. Un reset maison se superposait enfin au Preflight de Tailwind.

## Décision

La feuille globale `src/styles/main.css` devient l’unique source de la couche de style. Elle importe Tailwind et expose les tokens publics dans un bloc CSS-first `@theme`, dont Tailwind dérive les utilitaires. Sass et le fichier de configuration JavaScript de Tailwind ne sont plus nécessaires.

Les tokens de couleur exposés par le thème portent des noms sémantiques : `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`, `--color-surface-hover`, `--color-foreground`, `--color-muted`, `--color-border`, `--color-accent` et `--color-accent-strong`. Les trois premiers forment une échelle d’élévation ; les autres décrivent un rôle ou une intensité plutôt qu’une valeur de palette. La luminance de l’échelle augmente avec l’élévation en thème clair, mais diminue délibérément en thème sombre pour préserver le rendu antérieur. Tout nouveau niveau doit respecter cette convention inversée tant que la palette sombre n’est pas revue dans son ensemble.

Chaque token qui varie selon le thème réunit ses valeurs claire et sombre dans une seule déclaration `light-dark()`. Les deux accents, identiques dans les deux thèmes, gardent une valeur unique. La racine déclare `color-scheme: light dark` : le navigateur choisit la branche de `light-dark()` selon la préférence du système et applique également ce thème aux éléments natifs.

Trois tokens conservent une indirection de compatibilité : `--color-surface-hover`, `--color-muted` et `--color-border` référencent quatre variables `--legacy-*-rgb` déclarées sur `:root`. Leurs canaux fractionnaires préservent l’anticrénelage obtenu après minification. `--color-surface-hover` et `--color-border` partagent volontairement la même paire de valeurs, tout en restant deux rôles distincts qui pourront diverger. Cette indirection gèle le rendu hérité ; elle n’est pas le modèle à suivre pour de nouveaux tokens.

Le bloc `@theme` conserve aussi deux surcharges globales de parité avec Tailwind 3 : `--opacity-30: 30.196078%` reproduit l’alpha sérialisé à 77/255 pour l’usage actuel de `bg-accent/30`, mais affecte tout modificateur `/30` et l’utilitaire `opacity-30` ; `--shadow-sm` restaure l’ancienne ombre du même nom. Ces valeurs sont des shims de rendu, pas des choix généraux pour de nouveaux usages.

Le Preflight de Tailwind devient la base de normalisation et le reset maison disparaît. Un `@layer base` rétablit néanmoins deux comportements de Tailwind 3 nécessaires à l’identité visuelle : la couleur de bordure `gray-200` sur le sélecteur universel et les pseudo-éléments associés, ainsi que `max-width: 100%` sur les SVG. La couleur de bordure y reste une constante, y compris en thème sombre, au lieu d’utiliser `--color-border`, dont la valeur varie selon le thème et diffère légèrement en clair.

## Conséquences

- Ajouter un token de thème suffit à rendre disponibles les utilitaires Tailwind correspondants ; aucun utilitaire de couleur ne doit être réimplémenté à la main.
- Les branches claire et sombre d’un même rôle restent côte à côte dans `light-dark()`. Pour les trois tokens indirects, une modification doit également tenir compte des variables `--legacy-*-rgb` tant que la compatibilité est conservée.
- Le site continue de suivre la préférence du système sans JavaScript.
- Un futur sélecteur de thème devra seulement forcer `color-scheme` sur l’élément racine, par exemple avec `:root[data-theme='light'] { color-scheme: light; }` et `:root[data-theme='dark'] { color-scheme: dark; }`. Les tokens, les utilitaires et leurs variantes ne seront pas dupliqués.
- Les contrôles natifs du navigateur suivent le thème sélectionné grâce à `color-scheme`.
- La suppression du préprocesseur réduit la chaîne de compilation et garde toute l’architecture des styles lisible dans un seul fichier CSS.
- La nomenclature sémantique rend le rôle d’une classe compréhensible depuis le markup, mais impose de choisir le rôle d’un nouveau token avant de le nommer.
- Les variables `--legacy-*-rgb`, les surcharges `--opacity-30` et `--shadow-sm`, ainsi que les règles de compatibilité dans `@layer base`, pourront être retirées lorsqu’un changement autorisera explicitement de rompre la parité avec l’ancien rendu. D’ici là, aucun nouvel usage ne doit dépendre de ces shims sans assumer leur sémantique héritée.
