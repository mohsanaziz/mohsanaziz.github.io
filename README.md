# CV de Mohsan Aziz

[mohsanaziz.github.io](https://mohsanaziz.github.io/) est le CV en ligne et portfolio personnel de Mohsan Aziz. Le site statique est construit avec [Astro](https://astro.build/) et [Tailwind CSS](https://tailwindcss.com/), puis publié sur GitHub Pages.

## Développement

Le projet nécessite Node.js 24 et npm. Après avoir cloné le dépôt, installez les dépendances et démarrez le serveur local :

```sh
npm install
npx playwright install chromium
npm run dev
```

Le site est alors accessible sur `http://localhost:4321`.

## Build

La commande suivante vérifie le projet avec `astro check`, génère le site de production dans `dist/`, puis produit le CV PDF dans `dist/cv/CV.pdf` avec Chromium :

```sh
npm run build
```

Le test d’intégration s’exécute sur le PDF produit par ce build :

```sh
npm test
```

Le résultat peut être prévisualisé localement après le build :

```sh
npm run preview
```

## Déploiement

Le site est déployé sur GitHub Pages par GitHub Actions. Une publication courante se lance avec le workflow `Release` depuis l’onglet Actions, sur `main`, en choisissant un incrément `patch`, `minor` ou `major`. La pipeline vérifie le build, publie la version et déclenche le déploiement sans autre intervention.

La stratégie de déploiement est documentée dans [l’ADR 0001](docs/adr/0001-release-driven-deployment.md) et l’automatisation de la release dans [l’ADR 0003](docs/adr/0003-automated-release-pipeline.md).
