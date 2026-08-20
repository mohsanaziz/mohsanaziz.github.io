# ADR 0006 — Générer le PDF du CV pendant le build

- Statut : accepté
- Date : 2026-08-20

## Contexte

Le lien « Version PDF » du site cible `/cv/CV.pdf`, mais ce fichier était un asset maintenu manuellement dans `public/`. Une modification du contenu ou de la présentation du CV pouvait donc laisser en ligne un PDF périmé, sans signaler d’erreur pendant le build. Le PDF doit en outre conserver une couche texte et un flux de lecture vérifiables par les outils de recrutement.

La route `/cv-print` fournit déjà une représentation A4, mono-colonne et non indexée à partir des mêmes données que le site. Elle constitue la source imprimable, tandis que l’URL publique et le nom du fichier téléchargé doivent rester inchangés.

## Décision

`npm run build` exécute la vérification Astro, produit le site statique, puis lance `scripts/generate-pdf.mjs`. Ce script sert temporairement le dossier `dist/` sur une adresse locale, ouvre `/cv-print` avec le Chromium fourni par Playwright et attend le chargement complet de la page et de ses polices.

Le PDF est produit par l’appel CDP `Page.printToPDF` avec les fonds d’impression, le pied de page et `preferCSSPageSize: true`. La taille définie par `@page` reste ainsi A4 au lieu d’être ajustée au format Letter par défaut de Chromium. Le pied de page porte « Généré depuis mohsanaziz.github.io · v{version} — page n/m », où la version provient de `package.json`.

Avant cet appel, Playwright applique le média d’impression et mesure le document dans un viewport égal à la zone utile de la page A4. Il essaie, du plus grand au plus petit, les paliers typographiques XL (×1,3), L (×1,15) et M (×1). Le premier palier dont la hauteur tient dans cette zone est conservé ; si tous débordent, M reste le plancher lisible et la pagination prend le relais. Le palier retenu est ajouté au titre du PDF afin que cette décision reste observable depuis l’artefact d’intégration. Cette mesure s’exécute uniquement pendant la génération : aucun JavaScript d’ajustement n’est livré aux visiteurs du site.

Avec le contenu actuel, les descriptions atteignent environ 133,5 caractères par ligne au palier M et le document occupe environ 97 % de la hauteur A4 utile mesurée. L et XL dépassent cette hauteur. Le choix de M accepte donc ces lignes longues pour conserver simultanément les descriptions intégrales, le corps minimal lisible et la tenue sur une page ; réduire la largeur de composition ajouterait des retours à la ligne et ferait déborder ce volume. Une évolution du contenu privilégie toujours le plancher M, quitte à paginer, plutôt qu’une nouvelle réduction typographique.

Le débordement est couvert sans ajouter de missions aux données du CV : le mode `--pagination-test` du générateur ouvre la route avec le paramètre `?test-volume=pagination`, puis Playwright duplique dans le DOM imprimable les groupes et missions existants avec des marqueurs de test délimités. Ce code de préparation reste dans le générateur et n’est donc pas intégré au HTML déployé. L’artefact séparé, `tmp/pagination-test/CV.pdf`, est préparé par `npm test` hors de la racine `dist/` publiée. Le build nominal n’emploie ni ce paramètre ni ce mode et continue de produire uniquement `dist/cv/CV.pdf` depuis les données réelles.

En média d’impression, chaque mission et chaque bandeau employeur interdit la fragmentation interne, et le bandeau interdit aussi une rupture avant sa première mission. Le cadre d’expérience reste fragmentable et clone sa décoration sur chaque page, de sorte que le flux peut se rompre proprement entre deux missions sans introduire de structure en colonnes ou en tableau.

Le résultat est écrit directement dans `dist/cv/CV.pdf`. L’ancien asset `public/cv/CV.pdf` est supprimé ; le lien existant continue donc à servir le même chemin sans qu’un PDF généré soit versionné. Toute erreur de serveur, de chargement, de lancement de Chromium ou d’écriture se propage et fait échouer le build.

Le seam d’intégration unique reste le PDF généré. Le test ne dépend ni du DOM de `/cv-print` ni des détails internes du générateur. Il ouvre `dist/cv/CV.pdf` avec PDF.js et vérifie sa validité, son format A4, sa pagination actuelle, son pied de page, le contenu attendu et l’ordre employeur-missions du flux texte. Il vérifie également chaque environnement technique sous sa forme complète. Le PDF de stress vérifie en plus le maintien du palier M sur plusieurs pages, l’intégrité de chaque mission et bandeau employeur, le rattachement du bandeau à sa première mission, chaque pied de page `n/m` et la continuité du flux texte d’une page à l’autre. Ces attendus restent une référence explicite au contenu actuel plutôt que d’être dérivés de la source, afin qu’une suppression accidentelle des données et du rendu ne puisse pas se valider elle-même. Le média d’impression utilise des fontes sans-serif et monospace système métriquement compatibles et désactive les ligatures afin que Chromium conserve un mapping Unicode extractible de manière identique sur macOS et Linux.

Les workflows de vérification, de release et de déploiement installent explicitement Chromium avant `npm run build`. Le workflow de vérification exécute ensuite le test d’intégration sur l’artefact effectivement généré.

## Conséquences

- Le site et le PDF sont construits depuis les mêmes données ; une release ne peut plus embarquer silencieusement l’ancien asset manuel.
- `npm run build` requiert une installation Playwright de Chromium et devient volontairement en échec si la génération du PDF échoue.
- Le PDF reste un fichier statique téléchargeable sans JavaScript à l’URL `/cv/CV.pdf`.
- Le serveur de développement ne produit pas ce fichier ; le lien de téléchargement se vérifie après un build avec `npm run preview`.
- Les changements futurs de mise en page sont validés au niveau de l’artefact public et de son flux texte, sans figer l’implémentation de `/cv-print`.
