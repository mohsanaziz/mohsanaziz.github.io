# CV de Mohsan Aziz

CV en ligne et portfolio personnel de Mohsan Aziz. Le site statique est construit avec [Astro](https://astro.build/) et [Tailwind CSS](https://tailwindcss.com/), puis publié sur GitHub Pages.

## Développement

Le projet nécessite Node.js 24 et npm. Après avoir cloné le dépôt, installez les dépendances et démarrez le serveur local :

```sh
npm install
npm run dev
```

Le site est alors accessible sur `http://localhost:4321`.

## Build

La commande suivante vérifie le projet avec `astro check`, puis génère le site de production dans `dist/` :

```sh
npm run build
```

Le résultat peut être prévisualisé localement après le build :

```sh
npm run preview
```

## Déploiement

Le site est déployé sur GitHub Pages par GitHub Actions. La stratégie et la procédure de publication sont documentées dans [l’ADR 0001](docs/adr/0001-release-driven-deployment.md).
