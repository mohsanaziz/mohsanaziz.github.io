# CV de Mohsan Aziz

[mohsanaziz.github.io](https://mohsanaziz.github.io/) est le CV en ligne et portfolio personnel de Mohsan Aziz. Le site statique est construit avec [Astro](https://astro.build/) et [Tailwind CSS](https://tailwindcss.com/), puis publié sur GitHub Pages.

## Développement

Le projet nécessite Node.js 24 et npm. Après avoir cloné le dépôt, installez les dépendances et démarrez le serveur local :

```sh
npm ci
npx playwright install chromium
npm run dev
```

Le site est alors accessible sur `http://localhost:4321`. Il sert une URL par locale : `/` en français, `/en/` en anglais et `/ar/` en arabe de droite à gauche, sans `/fr/` ni redirection. Les locales sont déclarées une seule fois dans `src/i18n/locales.ts`, et les pages sont produites par les routes `src/pages/[...locale]/`.

Le contenu du CV est séparé entre le noyau invariant `src/data/cv.ts` et les calques complets `src/i18n/fr.ts`, `src/i18n/en.ts` et `src/i18n/ar.ts`. Chaque calque exporte ses messages d’interface et son contenu localisé. Leur forme est contrôlée par TypeScript : une clé manquante, notamment dans le calque anglais, fait échouer `astro check` et donc le build.

Les polices ne sont pas versionnées. Les scripts `predev`, `prestart` et `prebuild` téléchargent Noto Sans Arabic v2.012 (sous-ensembles latin et arabe) et Noto Sans Mono v2.014 dans `public/fonts/`, puis vérifient leur empreinte SHA-256. `npm run font:download` permet de lancer explicitement ce provisionnement.

## Build

La commande suivante vérifie le projet avec `astro check`, génère le site de production dans `dist/`, puis produit avec Chromium un PDF par locale : `dist/cv/CV.pdf`, `dist/cv/CV-en.pdf` et `dist/cv/CV-ar.pdf` :

```sh
npm run build
```

Les tests d’intégration s’exécutent sur les artefacts produits par ce build :

```sh
npm test
```

Avant la suite, `pretest` génère deux PDF de stress de pagination, `tmp/pagination-test/CV.pdf` pour le français et `tmp/pagination-test/CV-ar.pdf` pour l’arabe. Ces fichiers temporaires, comme les polices provisionnées, sont ignorés par Git. Le rendu de `dist/cv/CV-ar.pdf` doit en outre être revu visuellement par un humain à chaque changement de police ou d’interlignage : les tests automatiques valident sa structure et sa couche texte, pas le rognage éventuel des glyphes.

Le résultat peut être prévisualisé localement après le build :

```sh
npm run preview
```

En mode développement, les PDF sous `/cv/` n’existent pas encore et les liens de téléchargement sont donc indisponibles. Utilisez `npm run build`, puis `npm run preview`, pour vérifier les artefacts générés.

## Déploiement

Le site est déployé sur GitHub Pages par GitHub Actions. Une publication courante se lance avec le workflow `Release` depuis l’onglet Actions, sur `main`, en choisissant un incrément `patch`, `minor` ou `major`. La pipeline vérifie le build, publie la version et déclenche le déploiement sans autre intervention.

La stratégie de déploiement est documentée dans [l’ADR 0001](docs/adr/0001-release-driven-deployment.md) et l’automatisation de la release dans [l’ADR 0003](docs/adr/0003-automated-release-pipeline.md).
