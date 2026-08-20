# ADR 0003 — Automatiser la pipeline de release

- Statut : accepté
- Date : 2026-08-18

## Amendement du 20 août 2026

Depuis le préfactoring du déploiement décrit par l'issue
[#48](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/48),
`deploy.yml` configure Node.js directement à partir de `.nvmrc` au lieu de
transmettre une version dupliquée à `withastro/action`. Le workflow de release
et le workflow de déploiement partagent ainsi la même source de vérité ; la
contrainte de synchronisation mentionnée ci-dessous est conservée comme
historique de l'implémentation initiale.

## Contexte

L’[ADR 0001](0001-release-driven-deployment.md) sépare la publication du site des changements intégrés à `main`, mais sa procédure de release reste manuelle. Elle demande de calculer et committer la nouvelle version, de pousser le commit et son tag, puis de publier une release. Ces gestes peuvent être exécutés dans le mauvais ordre ou avec un état local qui ne correspond pas exactement à `main`.

GitHub ne déclenche pas un nouveau workflow pour la plupart des événements créés avec le `GITHUB_TOKEN` du dépôt. Une release publiée par une action ne déclencherait donc pas le workflow de déploiement sur son événement `release: published`. `workflow_dispatch` fait partie des exceptions à cette règle.

## Décision

Un workflow `Release`, déclenchable uniquement à la main depuis `main`, devient le chemin nominal de publication. Son seul paramètre est le type d’incrément `patch`, `minor` ou `major`. Au démarrage effectif du job, le workflow récupère explicitement la tête courante de `main`, tout l’historique et les tags. Une release restée en attente derrière une autre part ainsi de la version que celle-ci vient de publier plutôt que du commit qui était courant à la création du run. Le workflow installe ensuite la version de Node.js déclarée dans `.nvmrc` et les dépendances avec `npm ci`, puis configure l’identité `github-actions[bot]`.

La pipeline exécute les opérations dans cet ordre :

1. `npm version` calcule la version depuis `package.json`, met à jour `package.json` et `package-lock.json`, crée un commit nommé `X.Y.Z` et le tag annoté `vX.Y.Z` ;
2. le site est construit sur ce commit encore local au runner ;
3. le commit et le tag sont poussés ensemble vers `main` par un push atomique ;
4. une release publiée est créée depuis le tag avec ses notes générées ;
5. `deploy.yml` est déclenché par `workflow_dispatch` sur ce même tag.

Cet ordre constitue la garantie principale. Toutes les opérations réversibles précèdent le premier changement public : si l’installation, le bump ou le build échoue, `main`, les tags distants, les releases et le site restent inchangés. Le push atomique empêche également de publier seulement le commit ou seulement son tag.

Le déploiement est dispatché explicitement plutôt que de recourir à un jeton personnel capable de faire réagir l’événement `release`. Le `GITHUB_TOKEN` éphémère reste limité au dépôt et le workflow déclare seulement `contents: write`, nécessaire au push et à la release, et `actions: write`, nécessaire au dispatch. Positionner le dispatch sur le tag garantit que le build de déploiement porte sur le commit versionné et respecte la règle `v*` de l’environnement `github-pages`.

Aucune compensation automatique n’est tentée après le push. Supprimer un tag, une release ou un commit distant masquerait l’état réellement atteint et pourrait interrompre une reprise manuelle. Si la création de la release ou le dispatch échoue, le run reste en erreur et son résumé indique ce qui a déjà été publié ainsi que la commande à rejouer.

## Conséquences

- Une release courante ne demande plus de préparer un environnement local ni de saisir un numéro de version.
- Deux releases ne peuvent pas s’exécuter en parallèle ; elles partagent le groupe de concurrence `release` et une exécution engagée n’est jamais annulée par la suivante.
- Un merge sur `main` après le checkout peut rendre le push non-fast-forward. Le push atomique laisse alors le commit et le tag distants inchangés ; la release doit être relancée pour repartir de la nouvelle tête de `main`.
- Le workflow refuse explicitement toute référence autre que `main`.
- Le push du `GITHUB_TOKEN` ne déclenche pas `check-build.yml`, mais le même build a déjà été exécuté avant le push sur le commit de version.
- La valeur de `.nvmrc` et le `node-version` utilisé par `withastro/action` dans `deploy.yml` doivent rester identiques. Une montée de version de Node.js doit modifier les deux dans la même livraison pour que le build de garde représente le build déployé.
- La publication de la release ne déclenche pas elle-même `deploy.yml` ; le dispatch explicite est indispensable.
- L’environnement `github-pages` doit conserver sa règle de tag `v*`, comme décrit dans l’ADR 0001.
- Le réglage GitHub **Settings > Actions > General > Workflow permissions** doit continuer à autoriser les permissions d’écriture demandées par le workflow. Ce réglage n’est pas versionné et doit être vérifié si le push, la création de release ou le dispatch est refusé malgré les permissions déclarées dans le fichier.
- Les protections de branche et les rulesets doivent continuer à autoriser le push direct du `GITHUB_TOKEN` vers `main`. Une règle imposant le passage par une pull request bloque la pipeline avant toute écriture distante et doit donc prévoir une exception pour l’identité du workflow.
- La procédure manuelle de l’ADR 0001 reste disponible comme chemin de secours.
