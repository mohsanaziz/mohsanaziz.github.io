# ADR 0008 — Négocier la langue du navigateur depuis la racine

- Statut : accepté
- Date : 2026-08-31

## Contexte

L’[ADR 0007](0007-i18n-rtl.md) a écarté toute négociation de langue et toute redirection. Une de ses prémisses était qu’une détection enverrait un lecteur arabophone sur une page dont le contenu n’était pas traduit. Cette prémisse est caduque depuis la traduction complète du CV arabe par l’issue [#98](https://github.com/mohsanaziz/mohsanaziz.github.io/issues/98) : les versions française, anglaise et arabe tiennent désormais la même promesse de contenu.

Une autre prémisse reste vraie. `mohsanaziz.github.io/` est l’URL imprimée sur le CV papier, posée sur LinkedIn et citée dans le pied de page des PDF. Elle demeure l’URL de la page française elle-même lorsqu’aucune redirection n’est requise, et non celle d’une coquille de transit : un navigateur francophone ou dont aucune langue annoncée n’est servie doit rendre `/` sans subir de saut.

Cette même URL figure dans le pied de page traduit des trois PDF. Un lecteur du PDF anglais ou arabe reçoit donc une URL commune qui sert aujourd’hui le français, alors qu’une version complète dans sa langue existe. GitHub Pages ne pouvant négocier la langue côté serveur, un raccourci côté client est nécessaire pour le conduire immédiatement vers l’URL qui nomme sa langue.

## Décision

La négociation est strictement bornée à la racine `/`. Elle parcourt dans leur ordre les langues de `navigator.languages`, compare leur sous-tag primaire aux locales servies et retient la première correspondance. L’anglais mène à `/en/`, l’arabe à `/ar/` ; le français et l’absence de correspondance ne déclenchent aucune redirection. La chaîne de requête et le fragment sont conservés sur la cible, et la navigation remplace l’entrée courante de l’historique.

Les routes `/en/` et `/ar/`, les routes d’impression, les cartes Open Graph et la page 404 ne négocient rien. Une URL localisée continue ainsi de servir la langue qu’elle nomme, indépendamment des préférences du navigateur.

Le paramètre d’URL `lang` est la seule échappatoire à la négociation sur `/`. Le lien vers le français du sélecteur de langue et celui de la page 404 l’émettent sous la forme `?lang=fr` afin qu’un visiteur choisissant explicitement le français y reste, y compris après un rechargement. La présence de la clé `lang` suffit, quelle que soit sa valeur : celle-ci n’est pas interprétée. Le paramètre reste dans la barre d’adresse ; il ne fait partie ni des URL canoniques, ni des `hreflang`, ni des métadonnées Open Graph, ni des URL imprimées.

L’absence de stockage côté client est une décision : le site ne lit ni n’écrit de cookie, de `localStorage` ou de `sessionStorage`. Le choix explicite est porté par l’URL seule, sans état caché et sans préférence durable qui pourrait contredire un lien partagé.

La racine livre un script minimal, inline dans le `<head>` et exécuté avant le rendu du corps, afin d’éviter un affichage transitoire du contenu français. Toutes les autres pages restent sans script. Sans JavaScript, `/` continue de rendre intégralement la page française et son sélecteur de langue fonctionnel.

Le contrat de test sur la sortie de build se resserre avec l’exception au lieu de disparaître : `/` doit porter exactement le script inline de négociation, les huit autres pages localisées et la page 404 restent sans `<script>`, et aucune page ne livre de redirection `meta refresh`.

Cette décision remplace donc partiellement trois passages de l’ADR 0007, qui reste inchangé comme trace datée :

1. « Aucune négociation de langue » (§ 1) tombe à la racine, parce que la traduction arabe achevée par #98 rend caduque la prémisse qui l’interdisait. La règle reste valable sur toutes les autres URL.
2. « ni cookie, ni `localStorage`, ni redirection » (§ 4) tombe pour la seule redirection depuis `/`, nécessaire pour révéler les versions désormais complètes. L’absence de cookie et de stockage local est conservée et renforcée par le marqueur d’URL comme unique mémoire du choix.
3. « aucun JavaScript livré » (Conséquences) tombe pour le seul script de négociation de `/`, GitHub Pages n’offrant pas d’exécution côté serveur et le saut devant précéder le rendu. L’invariant devient : seule la racine livre ce script ; toutes les autres pages restent sans JavaScript.

Le refus du JSON-LD dans l’ADR 0007 § 7 n’est pas rouvert. L’exception autorise le seul script de négociation sur `/` ; elle n’autorise pas l’ajout d’un script de données structurées.

## Conséquences

- Un lecteur anglophone ou arabophone suivant l’URL commune atteint directement le CV complet dans sa langue ; le français reste servi à `/` sans saut.
- Le comportement dépend de JavaScript comme amélioration progressive : lorsqu’il est absent ou désactivé, le contenu français et la navigation manuelle restent disponibles.
- Le choix du français est visible et partageable dans l’URL. Aucun stockage ne le prolonge hors de cette URL.
- Le risque SEO est accepté : un robot d’indexation qui exécute le script et annonce une préférence anglophone pourra recevoir `/en/` lorsqu’il visite `/`.
- Les `canonical` auto-référents et le groupe `hreflang` réciproque restent la défense contre cette ambiguïté. `x-default` continue de pointer sur `/`, l’URL commune atteinte sans choix explicite et point de départ de l’orientation.
- La négociation ne doit pas s’étendre aux URL localisées, aux routes techniques ou à la page 404 ; leur contenu et leur comportement restent déterministes.
