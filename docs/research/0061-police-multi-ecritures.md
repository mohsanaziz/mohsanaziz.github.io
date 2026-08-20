# Recherche #61 — Une police libre pour latin, arabe et nastaliq ourdou

- Statut : recherche, aucune décision engagée
- Date : 2026-08-20
- Issue : #61 (parente : #60, carte multilingue fr/en/ar/ur)

## Question

> Existe-t-il une famille de polices, libre et auto-hébergeable, qui couvre convenablement les quatre écritures du site — latin (fr/en), arabe et nastaliq ourdou — et dans quelle mesure peut-elle remplacer Satoshi ?

## Réponse courte

**Non, une famille unique n'est pas possible** — et pour deux raisons indépendantes, dont la seconde est plus dérangeante que la première.

1. Le nastaliq ourdou est une tradition calligraphique distincte du naskh arabe, avec son propre jeu de glyphes contextuels. Aucun fichier libre ne réunit latin + naskh + nastaliq. Le meilleur compromis est **une famille de base couvrant fr/en/ar dans un seul fichier** (Noto Sans Arabic) **plus une compagne nastaliq** (Noto Nastaliq Urdu).
2. Surtout : **le PDF produit par `Page.printToPDF` ne restitue aucun texte arabe extractible, quelle que soit la police** — y compris avec la pile système actuelle. C'est une limite de Chromium, pas un critère de choix de police. Elle contraint l'issue #60 bien plus que le choix typographique.

Le détail, les mesures et les réserves suivent.

## Méthode et sources

Deux types d'affirmations sont mélangés ci-dessous et systématiquement distingués :

- **Source primaire** — `METADATA.pb` et `OFL.txt` du dépôt `google/fonts`, API CSS de Google Fonts (`fonts.googleapis.com/css2`), API GitHub des dépôts de fondeurs (`notofonts/*`, `simoncozens/Gulzar`, `rastikerdar/vazirmatn`, `silnrsi/font-awami`), fichiers `README`/`OFL` livrés dans les archives de release, spécification CSS Fonts Module Level 4.
- **Mesuré par moi** — les binaires ont été téléchargés dans `/tmp`, inspectés avec `fontTools` 4.63.0 (tables `head`, `hhea`, `OS/2`, `fvar`, `glyf`, `hmtx`), recompressés en WOFF2 via `fontTools.ttLib.woff2`, découpés via `fontTools.subset`, et rendus dans le Chromium de Playwright 1.62 fourni par le dépôt. Les PDF de test ont été produits par le même appel CDP `Page.printToPDF` que `scripts/generate-pdf.mjs`, puis relus avec le `pdfjs-dist` du dépôt. Aucun fichier du dépôt n'a été modifié et rien n'a été écrit dans `public/fonts/`.

Les pages de spécimen de Google Fonts sont rendues en JavaScript et ne se laissent pas lire par récupération HTTP simple ; les données de graisse, d'axes et de licence citées ici viennent donc des `METADATA.pb` et de l'API CSS, qui sont les sources que Google Fonts sert effectivement.

## Point de départ : ce que Satoshi fait aujourd'hui

Mesuré sur `public/fonts/Satoshi.woff2` du dépôt :

| Propriété                                                       | Valeur                                                |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| Taille du fichier                                               | 42 588 octets (41,6 Kio)                              |
| `unitsPerEm`                                                    | 1000                                                  |
| `hhea` ascender / descender / lineGap                           | 1010 / −240 / 100 → pavé de ligne **1350** (1,350 em) |
| `OS/2` sTypo (identique à `hhea`), `usWinAscent`/`usWinDescent` | 1010 / −240 / 100, 1010 / 240                         |
| `USE_TYPO_METRICS` (`fsSelection` bit 7)                        | activé                                                |
| Hauteur d'x / hauteur de capitale                               | 500 (0,500 em) / 740                                  |
| Nombre de glyphes / entrées `cmap`                              | 504 / 431                                             |
| Axe `fvar`                                                      | `wght` min 300, **défaut 900**, max 900               |
| Couverture arabe (U+0627)                                       | **absente**                                           |

Deux remarques qui comptent pour la suite.

- La plage `font-weight: 300 900` de `src/styles/main.css` correspond bien à l'axe du fichier, mais l'instance par défaut du fichier est à 900, pas à 400. Toute police de remplacement devra déclarer sa propre plage réelle plutôt que de recopier `300 900`.
- En média d'impression, `src/pages/cv-print.astro` n'utilise pas Satoshi : il bascule sur `Arial, 'Liberation Sans', sans-serif` avec `font-variant-ligatures: none`. Le remplacement de Satoshi et le choix de la police d'impression sont donc deux décisions séparées.

## Le verrou : nastaliq n'est pas du naskh

L'ourdou se compose traditionnellement en nastaliq. Ce n'est pas une variante stylistique du naskh : la ligne de base est oblique, les lettres d'un même mot se chevauchent verticalement, et le rendu exige un très grand nombre de glyphes contextuels produits par substitution.

La conséquence est visible dans les données du projet Noto lui-même : `notofonts/arabic` et `notofonts/nastaliq` sont **deux dépôts distincts**, et `METADATA.pb` classe Noto Sans Arabic en `SANS_SERIF` et Noto Nastaliq Urdu en `SERIF`, avec `primary_script: "Arab"` et `languages: "ur_Arab"` pour la seconde.

J'ai vérifié l'écart de compression du texte par mesure dans Chromium, sur la chaîne `سافٹ ویئر انجینئر` à 100 px : le nastaliq (Noto Nastaliq Urdu) rend 584 px là où la somme des glyphes isolés fait 1143 px, soit une compression de 49 %. Le naskh (Noto Sans Arabic) sur une phrase arabe rend 846 px pour 938 px isolés, soit 10 %. Le nastaliq n'est pas « de l'arabe avec un autre dessin » ; c'est un moteur de composition différent.

**Toutes les familles latin+arabe en un seul fichier — IBM Plex Sans Arabic, Vazirmatn, Rubik, Cairo, Almarai, Readex Pro, Noto Kufi Arabic — sont en naskh (ou en koufique).** Aucune ne compose l'ourdou en nastaliq. Les utiliser pour l'ourdou reviendrait à composer du français en Fraktur : lisible, mais faux.

Vérification de couverture par `cmap` (mesurée) sur 18 caractères propres à l'ourdou (ٹ ڈ ڑ ں ھ ے ہ ۂ ی ؤ ئ گ چ ژ پ ۓ ٪ ۔) :

| Police             | Caractères ourdous manquants         |
| ------------------ | ------------------------------------ |
| Noto Sans Arabic   | aucun                                |
| Noto Nastaliq Urdu | aucun                                |
| Vazirmatn          | aucun                                |
| Awami Nastaliq     | aucun                                |
| Gulzar             | `٪` (U+066A)                         |
| **Noto Sans**      | **les 18** — aucune couverture arabe |

Noto Sans seul ne couvre donc pas l'arabe : la combinaison « Noto Sans + Noto Sans Arabic » évoquée dans l'issue est en réalité redondante, comme le montre la section suivante.

## Candidate A — Noto Sans Arabic + Noto Nastaliq Urdu

### Découverte utile : Noto Sans Arabic contient déjà le latin de Noto Sans

`METADATA.pb` de `ofl/notosansarabic` déclare `subsets: "arabic"`, `"latin"`, `"latin-ext"`. J'ai vérifié que ce latin n'est pas un latin de dépannage mais **le dessin de Noto Sans lui-même** :

- sur 71 caractères testés (A–Z, a–z, 0–9, ponctuation, é è ç à ù), les 71 chasses sont **identiques** entre `NotoSans[wdth,wght].ttf` et `NotoSansArabic[wdth,wght].ttf` ;
- le glyphe `a` a la même boîte englobante dans les deux fichiers : (46, −10, 480, 545) ;
- hauteur d'x 536 et hauteur de capitale 714 dans les deux.

**Un seul fichier couvre donc fr, en et ar.** Ajouter Noto Sans à côté de Noto Sans Arabic n'apporterait que le grec, le cyrillique et le devanagari, dont le site n'a pas besoin.

### Métriques (mesurées)

|                                | Noto Sans Arabic v2.012         | Noto Nastaliq Urdu v4.000    |
| ------------------------------ | ------------------------------- | ---------------------------- |
| `unitsPerEm`                   | 1000                            | 1000                         |
| `hhea` asc/desc/gap            | 1374 / −738 / 0                 | 1904 / −596 / 0              |
| Pavé de ligne                  | **2112** (2,112 em)             | **2500** (2,500 em)          |
| `usWinAscent` / `usWinDescent` | 1431 / 738                      | 1904 / **1382**              |
| `sTypo*`                       | identiques à `hhea`             | identiques à `hhea`          |
| `USE_TYPO_METRICS`             | activé                          | activé                       |
| Hauteur d'x                    | 536 (0,536 em)                  | 536 (0,536 em)               |
| Glyphes / `cmap`               | 1711 / 1561                     | 1256 / —                     |
| Axes `fvar`                    | `wght` 100–900, `wdth` 62,5–100 | **`wght` 400–700 seulement** |

Le `usWinDescent` de 1382 du nastaliq mérite d'être souligné : l'encre descend jusqu'à 1,382 em **sous** la ligne de base, alors que `sTypoDescender` n'annonce que −596. Une hauteur de ligne serrée ne décalera pas le texte, elle le fera se chevaucher.

### Compatibilité avec `font-weight: 300 900`

- Noto Sans Arabic : `wght` 100–900 — **couvre intégralement** la plage actuelle.
- Noto Nastaliq Urdu : `wght` 400–700 — **ne la couvre pas**. Les graisses 300 et 900 utilisées aujourd'hui n'existent pas en nastaliq. Une hiérarchie typographique fondée sur le contraste 300/900 ne peut pas être reproduite dans la variante ourdoue ; il faudra la porter sur 400/700, ou sur autre chose que la graisse (taille, couleur, espacement).

### Régression à connaître dans la dernière version

Le dépôt `notofonts/arabic` publie `NotoSansArabic-v2.013` (2025-10-15), plus récente que la v2.012 servie par Google Fonts. **Ne pas l'épingler.** J'ai mesuré l'épaisseur du fût du `l` latin après instanciation à différentes graisses :

| `wght` | v2.012 — fût `l` | v2.013 — fût `l` | v2.013 — fût alef arabe |
| ------ | ---------------- | ---------------- | ----------------------- |
| 300    | 57               | 57               | 72,5                    |
| 400    | 88               | 88               | 101                     |
| 500    | —                | **88**           | 118,7                   |
| 600    | —                | **88**           | 138,4                   |
| 700    | **149**          | **88**           | 161                     |
| 800    | —                | 135,5            | 176,2                   |
| 900    | 191              | 191              | 194                     |

En v2.013, **le latin n'interpole plus entre 400 et 700** : un `font-weight: 700` rend un latin de graisse 400, alors que l'arabe, lui, s'épaissit normalement. La v2.012 se comporte correctement. La version à épingler est donc `NotoSansArabic-v2.012`.

Pour le nastaliq, en revanche, la version récente est nettement meilleure : `NotoNastaliqUrdu-v4.000` (2024-07-17) contient 1256 glyphes et une table `GSUB` de 16 984 octets, contre 1723 glyphes et **267 884 octets** de `GSUB` en v3.009 (la version que sert Google Fonts). Le WOFF2 passe de 267 464 à 160 132 octets. La réputation de lourdeur du nastaliq est fondée sur les versions antérieures ; la v4.000 la dément en grande partie.

### Poids réels (mesurés)

Toutes les tailles ci-dessous sont des WOFF2 produits par moi, axe `wdth` figé à 100 (inutile ici) et découpage par `fontTools.subset` avec `--layout-features='*'` (aucune fonctionnalité de mise en forme n'est retirée).

| Fichier                                                        | Contenu                                                               | Taille                  |
| -------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------- |
| Noto Sans Arabic v2.012 — latin                                | latin Google Fonts                                                    | **30 048 o (29,3 Kio)** |
| Noto Sans Arabic v2.012 — arabe                                | bloc arabe + formes de présentation                                   | 134 848 o (131,7 Kio)   |
| Noto Sans Arabic v2.012 — latin + arabe                        | un seul fichier                                                       | 168 668 o (164,7 Kio)   |
| Noto Nastaliq Urdu v4.000 — arabe                              | nastaliq                                                              | 121 356 o (118,5 Kio)   |
| _(référence)_ Noto Sans Arabic v2.012 complet, `wdth` conservé | —                                                                     | 361 584 o               |
| _(référence)_ WOFF2 servis par `fonts.gstatic.com`             | NSA arabe 166 152 o, NSA latin 31 368 o, NNU arabe (v3.009) 239 212 o | —                       |

Découpé par `unicode-range`, le budget devient :

- visiteur fr/en : **29,3 Kio** — soit **moins que les 41,6 Kio de Satoshi aujourd'hui** ;
- - variante arabe : +131,7 Kio ;
- - variante ourdoue nastaliq : +118,5 Kio ;
- pire cas, un visiteur qui charge les quatre écritures : 279,5 Kio.

Le découpage est licite : l'OFL 1.1 autorise explicitement la modification et la redistribution, et **aucun des `OFL.txt` de Noto ne comporte de Reserved Font Name**. C'est exactement la contrainte que la ITF FFL de Satoshi interdit aujourd'hui (`docs/licenses/satoshi.md`).

Attention toutefois : Noto Sans Arabic et Noto Nastaliq Urdu revendiquent **le même bloc Unicode** (U+0600–06FF). `unicode-range` ne peut donc pas router l'arabe vers le naskh et l'ourdou vers le nastaliq — ce sont les mêmes points de code. L'aiguillage devra se faire par sélecteur de langue (`:lang(ur)`) ou par classe, et le découpage par `unicode-range` ne servira qu'à séparer le latin de l'arabe.

### Licence et URL stable

- Licence : SIL Open Font License 1.1 pour les deux (`METADATA.pb` : `license: "OFL"`), en-tête `OFL.txt` : « Copyright 2022 The Noto Project Authors ». Redistribuable, modifiable, découpable, sans RFN.
- URL stables, adaptées au schéma « télécharger puis vérifier un SHA-256 » de `scripts/download-satoshi.mjs` :
  - `https://github.com/notofonts/arabic/releases/download/NotoSansArabic-v2.012/NotoSansArabic-v2.012.zip`
  - `https://github.com/notofonts/nastaliq/releases/download/NotoNastaliqUrdu-v4.000/NotoNastaliqUrdu-v4.000.zip`
  - Ce sont des assets de release attachés à des tags immuables, donc hachables de façon stable — nettement préférable aux URL `fonts.gstatic.com`, dont le segment `v{n}` est renuméroté par Google sans préavis (Noto Nastaliq Urdu y est actuellement servie en `v23`, c'est-à-dire la v3.009, pas la v4.000).
  - Réserve : les archives font 20,5 Mio (arabe) et 2,1 Mio (nastaliq). Un build qui les télécharge devra en extraire un fichier puis le découper, ce qui est plus lourd que le `curl` d'un seul WOFF2 aujourd'hui. Une alternative est d'épingler `raw.githubusercontent.com/google/fonts/<commit>/ofl/...`, immuable si le commit est figé.

## Candidate B — Vazirmatn (latin + arabe en un fichier, naskh)

Représentante des familles panscript naskh. Retenue plutôt qu'IBM Plex Sans Arabic, Cairo, Almarai ou Readex Pro parce qu'elle a un axe de graisse complet et une release GitHub taguée avec un WOFF2 officiel.

- Source : `github.com/rastikerdar/vazirmatn`, release `v33.003` (2022-06-22), asset `vazirmatn-v33.003.zip` (13 047 191 o). `METADATA.pb` : `license: "OFL"`, `axes { tag: "wght" min 100 max 900 }`.
- Métriques mesurées : `unitsPerEm` 2048 ; `hhea` 2100 / −1100 / 0 → pavé de ligne 3200, soit **1,5625 em** ; `usWinAscent`/`usWinDescent` 2200/1300 ; hauteur d'x 1082 (0,528 em) ; hauteur de capitale 1638 ; 1333 glyphes ; `USE_TYPO_METRICS` activé.
- Poids mesurés : WOFF2 officiel livré dans la release 111 152 o ; sous-ensemble latin + arabe produit par moi 84 304 o (82,3 Kio).
- Couverture : les 18 caractères ourdous testés sont présents.

**Mais c'est du naskh.** Vazirmatn compose l'ourdou dans une forme arabe standard, pas en nastaliq. Comme famille unique, elle « couvre » les quatre langues au sens de la `cmap`, tout en composant l'ourdou de façon typographiquement fautive.

Son intérêt réel est ailleurs : son pavé de ligne de 1,5625 em est **beaucoup plus proche** de celui de Satoshi (1,350 em) que celui de Noto Sans Arabic (2,112 em), et sa largeur de texte latin est presque identique à celle d'Arial (rapport 0,9988 à la graisse 400, mesuré). Si la mise en page A4 se révélait trop contrainte, c'est le meilleur candidat naskh à réévaluer — au prix de renoncer au nastaliq.

## Candidate C — Gulzar (nastaliq, alternative à Noto)

- Source : `github.com/simoncozens/Gulzar` (miroir `googlefonts/Gulzar`), minisite `gulzarfont.org`. Releases taguées : `Gulzar-v1.002` (2022-11-14), asset `Gulzar-Regular.ttf` de 990 468 o. Google Fonts sert la v1.000 (963 496 o).
- `METADATA.pb` : `license: "OFL"`, `category: "SERIF"`, `classifications: "DISPLAY"`, un seul `fonts { weight: 400 }`, **aucun bloc `axes`**. Concepteurs : Borna Izadpanah, Fiona Ross, Alice Savoie, Simon Cozens.
- Métriques mesurées : `unitsPerEm` 1000 ; `hhea` 1500 / −1200 / 0 → pavé de ligne **2700** (2,700 em), le plus haut de toutes les candidates ; `usWinAscent`/`usWinDescent` 1494/900 ; 1161 glyphes, 414 entrées `cmap`.
- Tables de mise en forme mesurées : `GPOS` 473 580 o et `GSUB` 274 682 o — les plus volumineuses de toutes les polices examinées ici, y compris Noto Nastaliq Urdu v3.009.
- Poids mesurés : WOFF2 complet 237 652 o ; sous-ensemble arabe 179 184 o (175,0 Kio), soit 48 % de plus que Noto Nastaliq Urdu v4.000. WOFF2 servi par gstatic : 191 768 o.

Gulzar est le nastaliq libre le plus abouti sur le plan du dessin, mais **une seule graisse, non variable**, et Google Fonts le classe lui-même comme police d'affichage. Il ne peut pas porter la hiérarchie d'un CV. Il lui manque par ailleurs `٪` (U+066A).

## Écartée — Awami Nastaliq (SIL)

Écartée sur source primaire, pas sur préférence esthétique.

Le `README.txt` livré dans la release `v3.400` (2025-10-17) de `github.com/silnrsi/font-awami` indique :

> « Font smarts have been implemented using Graphite only. We have no current plans to support OpenType. »

J'ai confirmé sur le binaire : `AwamiNastaliq-Regular.ttf` contient les tables `Feat`, `Silf`, `Glat`, `Gloc`, `Sill`, `Silt` (Graphite) et une table `GPOS`, mais **aucune table `GSUB`**. Or le nastaliq est produit par substitution contextuelle. Chromium compose avec HarfBuzz en mode OpenType et n'active pas Graphite : la police ne peut pas être mise en forme correctement dans un navigateur ni dans le PDF qui en découle.

Pour mémoire — métriques mesurées : `unitsPerEm` 2048 ; `hhea` 3600 / −1307 → 4907 (2,396 em) ; hauteur d'x 885 (0,432 em) ; 5 graisses statiques (Regular à ExtraBold) d'environ 644 à 654 Kio en TTF, 331 068 o en WOFF2 pour la Regular. L'`OFL.txt` porte de surcroît les Reserved Font Names « Awami » et « SIL », ce qui obligerait à renommer la police en cas de découpage.

## Tableau comparatif

|                             | Satoshi (actuel)               | Noto Sans Arabic v2.012             | Noto Nastaliq Urdu v4.000 | Vazirmatn v33.003       | Gulzar v1.002      | Awami Nastaliq v3.400 |
| --------------------------- | ------------------------------ | ----------------------------------- | ------------------------- | ----------------------- | ------------------ | --------------------- |
| Écritures                   | latin                          | latin + arabe **naskh**             | arabe **nastaliq**        | latin + arabe **naskh** | arabe **nastaliq** | arabe **nastaliq**    |
| Licence                     | ITF FFL 2.0                    | OFL 1.1                             | OFL 1.1                   | OFL 1.1                 | OFL 1.1            | OFL 1.1 + RFN         |
| Découpage autorisé          | **non**                        | oui                                 | oui                       | oui                     | oui                | oui, avec renommage   |
| Variable / plage `wght`     | oui, 300–900                   | oui, **100–900**                    | oui, **400–700**          | oui, 100–900            | **non**, 400 seul  | non, 5 statiques      |
| `unitsPerEm`                | 1000                           | 1000                                | 1000                      | 2048                    | 1000               | 2048                  |
| Pavé de ligne naturel       | 1,350 em                       | 2,112 em                            | **2,500 em**              | 1,5625 em               | **2,700 em**       | 2,396 em              |
| Hauteur d'x                 | 0,500 em                       | 0,536 em                            | 0,536 em                  | 0,528 em                | 0,500 em           | 0,432 em              |
| WOFF2 découpé (mesuré)      | 41,6 Kio (non découpable)      | 164,7 Kio latin+ar · 29,3 Kio latin | 118,5 Kio                 | 82,3 Kio latin+ar       | 175,0 Kio          | 323 Kio               |
| Mise en forme dans Chromium | oui                            | oui                                 | oui                       | oui                     | oui                | **non (Graphite)**    |
| Texte extractible du PDF    | **oui**                        | **non**                             | **non**                   | **non**                 | **non**            | s/o                   |
| URL stable hachable         | oui (fontshare, déjà en place) | release taguée                      | release taguée            | release taguée          | release taguée     | release taguée        |

## Contraintes du dépôt

### Impression Chromium — le point bloquant

C'est le résultat le plus important de cette recherche, et il ne départage pas les polices : il les disqualifie toutes de la même manière.

J'ai généré des PDF avec le Chromium de Playwright du dépôt et le même appel `Page.printToPDF` (`printBackground`, `preferCSSPageSize: true`) que `scripts/generate-pdf.mjs`, une casse par page pour éviter tout mélange, puis relu le flux texte avec le `pdfjs-dist` du dépôt. Chaînes source : `مهندس برمجيات أول` (ar) et `سافٹ ویئر انجینئر` (ur).

| Cas                                           | Points de code extraits | dont U+0000 | dont formes de présentation | Chaîne source restituée |
| --------------------------------------------- | ----------------------- | ----------- | --------------------------- | ----------------------- |
| Latin, Noto Sans Arabic                       | 27                      | 0           | 0                           | **oui, exacte**         |
| Arabe, Noto Sans Arabic                       | 25                      | 9           | 7                           | non                     |
| Ourdou, Noto Sans Arabic (naskh)              | 29                      | 15          | 5                           | non                     |
| Ourdou, Noto Nastaliq Urdu v4.000             | 40                      | **25**      | 0                           | non                     |
| Ourdou, Noto Nastaliq Urdu v3.009             | 39                      | 20          | 0                           | non                     |
| Arabe, Vazirmatn                              | 17                      | 0           | 10                          | non                     |
| Ourdou, Gulzar                                | 27                      | 16          | 0                           | non                     |
| **Arabe, Arial — la pile actuelle du dépôt**  | 17                      | 0           | 8                           | **non**                 |
| **Ourdou, Arial — la pile actuelle du dépôt** | 17                      | 0           | 10                          | **non**                 |
| Arabe, `system-ui` (macOS)                    | 1                       | 1           | 0                           | non                     |

Deux modes de défaillance apparaissent.

1. **Formes de présentation en ordre visuel.** Les polices naskh dont les formes contextuelles figurent dans la `cmap` (Noto Sans Arabic, Vazirmatn, Arial) produisent un `ToUnicode` qui renvoie vers les blocs Arabic Presentation Forms A/B (U+FB50–FDFF, U+FE70–FEFC), dans l'ordre visuel — donc inversé par rapport à l'ordre logique. Le texte est présent mais ce n'est pas la chaîne source ; une normalisation Unicode pourrait en récupérer une partie.
2. **Absence totale de correspondance.** Les polices nastaliq produisent leurs glyphes par substitution contextuelle ; ces glyphes n'ont aucune entrée `cmap` inverse, et Chromium écrit U+0000. Pour Noto Nastaliq Urdu v4.000, 25 des 40 points de code extraits sont U+0000. L'information est perdue, aucune post-correction n'est possible côté lecteur.

Le mécanisme correspond à ce que décrit le suivi de bogues Chromium à propos des ligatures en impression PDF (issue 41432982) : les glyphes sans valeur Unicode valide sont mis en correspondance avec Unicode 0, et le seul remède est une entrée `/ActualText`, que `printToPDF` n'émet pas. Je n'ai pas pu récupérer le texte intégral de ce ticket, dont la consultation exige une authentification ; l'affirmation ci-dessus repose donc sur mes propres mesures, la citation du ticket n'en étant qu'un appui secondaire.

Conséquences concrètes pour l'issue #60 :

- le contournement retenu par l'ADR 0006 — `font-variant-ligatures: none` pour stabiliser le `ToUnicode` — **ne s'applique pas à l'arabe**. J'ai mesuré la largeur de rendu avec `normal`, `font-variant-ligatures: none`, `calt 0` et `rlig 0` : les trois premières donnent des largeurs **rigoureusement identiques** (Noto Sans Arabic 2112 px, Noto Nastaliq Urdu 1566 px à 100 px) ; seul `rlig 0` bouge un peu (2112 → 2119 px). La spécification CSS Fonts Module Level 4 le confirme : « Required ligatures, needed for correctly rendering complex scripts, are not affected by the settings above, including `none` (OpenType feature: `rlig`) », et les implémentations « may choose to ignore turning off features which the OpenType specification says are always required ». **Bonne nouvelle secondaire : la règle `font-variant-ligatures: none` déjà présente dans `cv-print.astro` est sans danger pour l'arabe et le nastaliq** — elle ne casse pas la mise en forme ;
- en contrepartie, elle ne répare rien non plus. Le test d'intégration `pdf.integration.test.mjs`, qui vérifie le flux texte, **ne pourra jamais valider de contenu arabe ou ourdou**. Si le PDF devient multilingue, ses assertions devront rester cantonnées au contenu latin, et le fait que la couche texte arabe soit non extractible devra être assumé explicitement plutôt que découvert en test.

### Budget A4 et métriques verticales

`.print-document` fixe `line-height: 1.3` (sans unité) sur le conteneur, valeur héritée par toute la page. Le pavé de ligne naturel de la police est donc **entièrement neutralisé** pour le latin, et le passage d'Arial à Noto Sans Arabic ne fera pas gonfler la hauteur du document de ce fait. Le risque est ailleurs, et il est réel : à graisse et corps égaux, le latin de Noto Sans Arabic est **plus large** que celui d'Arial. Mesuré dans Chromium sur une description française de 182 caractères, rapport de largeur à la graisse 400 :

| Police                      | Rapport / Arial 400 |
| --------------------------- | ------------------- |
| `system-ui` (macOS)         | 0,930               |
| Satoshi                     | 0,985               |
| Vazirmatn                   | 0,999               |
| Arial                       | 1,000               |
| **Noto Sans Arabic v2.012** | **1,065**           |

L'ADR 0006 note que le palier M occupe déjà environ 97 % de la hauteur A4 utile avec environ 133,5 caractères par ligne. Un latin 6,5 % plus large réduit d'autant le nombre de caractères par ligne, ajoute des retours à la ligne et fait très probablement basculer le document en pagination. C'est un effet à mesurer sur le document réel avant de trancher, et c'est le principal argument en faveur d'une réévaluation de Vazirmatn (rapport 0,999) si l'on tenait absolument à la page unique.

Pour l'ourdou, le problème est inverse et plus dur : Noto Nastaliq Urdu a un `usWinDescent` de 1,382 em. Un `line-height: 1.3` hérité produira des chevauchements entre lignes. La colonne ourdoue devra recevoir sa propre hauteur de ligne, de l'ordre de 2,5, ce qui interdit de fait de faire tenir la variante ourdoue dans le même gabarit A4 d'une page que la variante française.

Pour mémoire, hauteurs de ligne naturelles mesurées dans Chromium à `font-size: 100px`, `line-height: normal` : Arial 115, `system-ui` (macOS) 118, Noto Sans 136, Satoshi 135 (valeur calculée depuis `hhea`), Vazirmatn 157, Noto Sans Arabic 211, Noto Nastaliq Urdu 250, Gulzar 270.

### Build, empreinte et licence

Le schéma de `scripts/download-satoshi.mjs` — télécharger, vérifier un SHA-256 attendu, écrire dans `public/fonts/` — se transpose sans difficulté, avec deux ajustements :

- il faudra deux ou trois fichiers au lieu d'un, donc autant d'empreintes ;
- les sources stables sont des archives ZIP de release (20,5 Mio pour l'arabe), pas des WOFF2 isolés. Le script devra extraire puis découper, ou bien le dépôt choisira d'épingler `raw.githubusercontent.com/google/fonts/<commit>/ofl/...`, immuable dès lors que le commit est figé.

Côté licence, l'OFL 1.1 lève la contrainte majeure de la ITF FFL 2.0 documentée dans `docs/licenses/satoshi.md` : le découpage devient licite, ce qui rend possible le budget de 29,3 Kio pour le visiteur fr/en. En contrepartie, l'OFL impose de redistribuer le texte de la licence avec la police ; `docs/licenses/` devra recevoir une entrée par famille.

## Recommandation

**Famille unique : non.** Deux fichiers, et c'est un plancher, pas un compromis paresseux.

Retenir :

1. **Noto Sans Arabic v2.012** (`wdth` figé à 100), découpée en deux `@font-face` par `unicode-range` — latin 29,3 Kio, arabe 131,7 Kio. Elle remplace Satoshi pour fr/en **et** couvre l'arabe dans le même dessin, avec la même hauteur d'x, la même hauteur de capitale et un axe `wght` 100–900 qui englobe la plage 300–900 actuelle. Pour le visiteur francophone, c'est 12 Kio de moins qu'aujourd'hui.
2. **Noto Nastaliq Urdu v4.000** pour l'ourdou seul, 118,5 Kio, chargée uniquement sur la variante `ur`, aiguillée par `:lang(ur)` et non par `unicode-range` — les deux polices revendiquent le même bloc Unicode.

Épingler ces versions précises, pas les plus récentes : la v2.013 de Noto Sans Arabic casse l'interpolation du latin entre les graisses 400 et 700, tandis que pour le nastaliq c'est au contraire la v4.000 qu'il faut, la v3.009 servie par Google Fonts étant 67 % plus lourde.

Écarter Gulzar (graisse unique, classée « display », 48 % plus lourde) et Awami Nastaliq (Graphite seul, ne se met pas en forme dans un navigateur). Garder Vazirmatn en réserve : c'est la seule candidate dont les métriques latines préservent presque exactement le gabarit A4 actuel, mais elle compose l'ourdou en naskh, ce qui contredit l'objectif de l'issue.

Trois conséquences à accepter explicitement, faute de quoi la décision serait mal prise :

- **la variante ourdoue ne tiendra pas dans le même gabarit A4 d'une page** que la variante française : le nastaliq exige une hauteur de ligne d'environ 2,5 et descend à 1,382 em sous la ligne de base ;
- **la hiérarchie 300/900 disparaît en ourdou**, où l'axe s'arrête à 400–700 ; il faudra la porter sur la taille ou l'espacement ;
- **le texte arabe et ourdou du PDF ne sera pas extractible**, quelle que soit la police retenue. Ce n'est pas un défaut de Noto : la pile Arial actuelle échoue exactement de la même façon. Si l'extractibilité du CV est un objectif tenu, alors le PDF doit rester monolingue latin et les variantes ar/ur rester des pages web.

Le remplacement de Satoshi est donc non seulement possible mais avantageux en poids pour le cas nominal. Ce qui ne l'est pas, c'est l'hypothèse implicite de l'issue #60 selon laquelle les quatre variantes partageraient un même gabarit imprimable.

## Points non tranchés

- **L'effet réel sur la pagination A4 n'est pas mesuré.** Le rapport de largeur de 1,065 face à Arial est mesuré sur une seule phrase de 182 caractères, pas sur le document `/cv-print` complet. Il faut refaire la mesure des paliers XL/L/M sur le vrai contenu avant de conclure que la page unique est perdue.
- **Le ticket Chromium 41432982 n'a pas pu être lu.** `issues.chromium.org` exige une authentification. L'explication du mécanisme `ToUnicode` → U+0000 → `/ActualText` repose ici sur mes mesures ; la référence au ticket n'est qu'un appui. Je n'ai pas cherché à savoir si une version future de Chromium émet `/ActualText`.
- **Aucune post-correction du PDF n'a été testée.** Réécrire les tables `ToUnicode` ou injecter des entrées `/ActualText` après coup pourrait rendre l'arabe extractible. C'est une piste réelle mais non explorée, et elle ajouterait une dépendance de manipulation PDF au build.
- **La qualité typographique du nastaliq n'a pas été jugée.** Je n'ai comparé Noto Nastaliq Urdu v4.000 et Gulzar que sur des données mesurables (poids, tables, axes, métriques). La v4.000, nettement plus légère que la v3.009, pourrait avoir simplifié le dessin ; seul un lecteur d'ourdou peut arbitrer ce point.
- **Le comportement sur Linux n'a pas été vérifié.** Toutes les mesures viennent de macOS 25.6. L'ADR 0006 tient à un rendu identique sur macOS et Linux ; les polices étant ici embarquées plutôt que système, le risque est faible, mais il n'est pas mesuré.
- **IBM Plex Sans Arabic, Cairo, Almarai, Readex Pro et Noto Kufi Arabic n'ont été vérifiées que sur `METADATA.pb`** (licence OFL, axes, sous-ensembles). Elles sont toutes en naskh ou en koufique et tombent donc sous la même objection que Vazirmatn ; je ne les ai pas mesurées plus avant.
