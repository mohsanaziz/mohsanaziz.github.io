# ADR 0002 — Tokens de thème déclarés en CSS avec `light-dark()`

- Statut : accepté
- Date : 2026-08-17

## Contexte

La couche de style reposait sur Sass et contournait le système de thème de Tailwind. Un fichier réimplémentait manuellement des utilitaires de couleur que Tailwind sait générer, y compris leur variante d’opacité. Les couleurs d’accent étaient codées en dur dans ces règles plutôt que déclarées comme des tokens.

Le thème provenait en outre d’un modèle copié dont dix des dix-sept variables n’étaient jamais utilisées. Les valeurs restantes mélangeaient plusieurs notations de couleur incompatibles et leurs noms décrivaient mal leur rôle : le fond dit « tertiaire » était la surface la plus en avant, tandis que le token dit `input` ne servait qu’au survol des puces de compétences.

Le mode sombre était défini dans une media query qui redéclarait toutes les variables. Ajouter un sélecteur de thème aurait donc demandé de dupliquer à nouveau le thème. Sass n’apportait par ailleurs que le découpage en fichiers, l’imbrication de sélecteurs et un barrel d’imports, tous couverts par CSS natif. Un reset maison se superposait enfin au Preflight de Tailwind.

## Décision

La feuille globale `src/styles/main.css` devient l’unique source de la couche de style. Elle importe Tailwind et déclare le thème dans un bloc CSS-first `@theme`, dont Tailwind dérive les utilitaires. Sass et le fichier de configuration JavaScript de Tailwind ne sont plus nécessaires.

Les tokens de couleur exposés par le thème portent des noms sémantiques : `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`, `--color-surface-hover`, `--color-foreground`, `--color-muted`, `--color-border`, `--color-accent` et `--color-accent-strong`. Les trois premiers forment une échelle d’élévation ; les autres décrivent un rôle ou une intensité plutôt qu’une valeur de palette.

Chaque token qui varie selon le thème réunit ses valeurs claire et sombre dans une seule déclaration `light-dark()`. Les deux accents, identiques dans les deux thèmes, gardent une valeur unique. La racine déclare `color-scheme: light dark` : le navigateur choisit la branche de `light-dark()` selon la préférence du système et applique également ce thème aux éléments natifs.

Le projet s’appuie sur le Preflight de Tailwind comme seule normalisation. Les quelques règles de base conservées sont des ajustements ciblés de compatibilité avec le rendu antérieur, et non un second reset.

## Conséquences

- Ajouter un token de thème suffit à rendre disponibles les utilitaires Tailwind correspondants ; aucun utilitaire de couleur ne doit être réimplémenté à la main.
- Les valeurs claire et sombre d’un même rôle restent côte à côte, ce qui évite de modifier un thème en oubliant l’autre.
- Le site continue de suivre la préférence du système sans JavaScript.
- Un futur sélecteur de thème devra seulement forcer `color-scheme` sur l’élément racine, par exemple avec `:root[data-theme='light'] { color-scheme: light; }` et `:root[data-theme='dark'] { color-scheme: dark; }`. Les tokens, les utilitaires et leurs variantes ne seront pas dupliqués.
- Les contrôles natifs du navigateur suivent le thème sélectionné grâce à `color-scheme`.
- La suppression du préprocesseur réduit la chaîne de compilation et garde toute l’architecture des styles lisible dans un seul fichier CSS.
- La nomenclature sémantique rend le rôle d’une classe compréhensible depuis le markup, mais impose de choisir le rôle d’un nouveau token avant de le nommer.
