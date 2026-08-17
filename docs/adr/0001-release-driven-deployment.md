# ADR 0001 — Déclencher les déploiements par la publication d’une release

- Statut : accepté
- Date : 2026-08-16

## Contexte

Le workflow GitHub Pages déployait le site à chaque push sur `main`. Un commit et une publication étaient donc le même geste : il était impossible de préparer plusieurs changements sans les rendre immédiatement publics, d’identifier clairement la version en ligne ou de redéployer simplement une version antérieure.

La vérification du build sur les pushes vers `main` et sur les pull requests est désormais assurée par un workflow distinct. Le déploiement peut donc être découplé du commit sans laisser `main` sans contrôle automatisé.

## Décision

Le workflow de déploiement est déclenché par l’événement GitHub `release` de type `published`, et non plus par les pushes vers `main`. La publication d’une release devient ainsi le geste explicite qui met le site à jour. La création ou le push d’un tag seuls ne déploient rien et laissent le temps de préparer les notes de version.

Le checkout reste implicite : pour un événement `release`, le contexte GitHub référence le commit pointé par le tag de la release. Le build porte donc sur le code versionné plutôt que sur le dernier état de `main`.

Le déclenchement `workflow_dispatch` est conservé. Depuis l’onglet Actions, son sélecteur de référence permet de choisir une branche ou un tag ; il sert à redéployer la version courante ou à revenir à une version antérieure.

Tous les déploiements appartiennent au groupe de concurrence `pages`. Ils sont exécutés un par un et `cancel-in-progress` vaut `false`, afin qu’un déploiement engagé ne soit jamais interrompu par un run plus récent.

Le workflow conserve ses deux jobs, les actions utilisées et l’environnement `github-pages`. Aucune condition n’exclut les pré-releases : toute release publiée déclenche un déploiement, et le projet s’engage à ne pas publier de pré-release.

## Conséquences

- Un commit ou un merge sur `main` signifie désormais « prêt à être publié », pas « en ligne ».
- Chaque état publié possède un tag et une release identifiables, avec des notes de version.
- Un tag poussé mais non publié n’a aucun effet sur le site public.
- Un déploiement manuel sur `main` reste techniquement possible. Cette porte volontaire permet une intervention d’urgence, mais contourne la garantie que la production correspond à une version taguée.
- En cas d’échec, GitHub Pages continue de servir le dernier déploiement réussi.
- Les déploiements sont sérialisés et peuvent donc attendre qu’un run précédent se termine.

## Procédure de release de secours

La pipeline automatisée décrite dans l’[ADR 0003](0003-automated-release-pipeline.md) est le chemin nominal. La procédure manuelle suivante reste disponible comme chemin de secours.

La release se fait en trois gestes, dans cet ordre :

1. Depuis un `main` propre et à jour, exécuter `npm version <major|minor|patch>` (ou `npm version 1.0.0` pour la première release). npm met à jour la version, crée le commit et crée le tag `vX.Y.Z`.
2. Pousser la branche et le tag avec `git push origin main --follow-tags`.
3. Publier la release à partir du tag existant et générer ses notes, par exemple avec `gh release create vX.Y.Z --generate-notes`.

Le tag doit toujours être poussé avant la création de la release. La première release est `v1.0.0` et son tag doit pointer sur un commit qui contient déjà le workflow décrit ici.

## Contrainte non versionnée de l’environnement

L’environnement GitHub `github-pages` protège les références autorisées à déployer. Il doit conserver la règle de branche `main` et comporter une règle de type `tag` avec le motif `v*`.

Cette policy est un réglage GitHub et n’apparaît pas dans le dépôt. Si l’environnement est supprimé ou recréé, la règle `v*` doit être réappliquée ; sinon les déploiements lancés par une release seront refusés malgré un workflow valide.
