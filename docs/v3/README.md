# VESTIGE V3 — atlas historique local

Travail local sur `codex/v3-historical-atlas`, à partir de la V2 complète avec avatar (`691456c`). Aucun push, PR, déploiement ou service payant n'a été lancé pour cette V3. Le projet d'origine et les branches précédentes sont conservés.

## Audit et choix cartographique

L'application utilisait déjà react-native-maps, MapKit sur iOS et le fournisseur natif Android, une caméra inclinée, un avatar animé en sprites, expo-location et un journal AsyncStorage. Le style JSON Google n'est pas appliqué par MapKit : une simple modification de ces couleurs ne pouvait pas changer réellement la carte iPhone.

La V3 conserve le moteur natif et ajoute LocalTile : une cartographie originale claire, créée hors ligne à partir des géométries OpenStreetMap conservées dans `data/import/osm-pilot.json`. Routes, parcs, eau et emprises de bâtiments proviennent de cet extrait. Le trait d'une rivière est un symbole cartographique, pas une limite de berge relevée. Seulement 5 bâtiments du secteur possèdent une hauteur explicite exploitable ; seuls ceux-là reçoivent des faces et ombres calculées. Les autres restent des emprises à plat. Il s'agit de 2,5D raster pré-dessinée, pas d'extrusions 3D temps réel. Les ombres ne tournent pas avec la caméra. Pas d'arbres inventés.

Couverture pilote : latitude 45.511–45.539, longitude 4.855–4.891, niveaux XYZ 14–18, 1 118 tuiles de 256 px. L'inclinaison à 45° et les gestes sont gérés par le moteur natif. L'atlas se prépare une fois par version, avec 8 copies/téléchargements d'assets simultanés maximum, puis reste dans le répertoire documents. Pendant la préparation ou en cas d'échec, la carte native reste utilisable. En développement, les assets sont téléchargés depuis Metro ; dans une application empaquetée ils sont embarqués. Le statut est visible dans les options. Pas d'appel Overpass/Wikipedia à chaque déplacement GPS.

Les tuiles disponibles sont chargées par le moteur selon la vue ; la première préparation copie toutefois tout le petit atlas, pas uniquement les tuiles visibles. Le catalogue complet de 35 lieux est embarqué : seuls les groupes situés dans la vue élargie sont rendus. Ce n'est pas encore une base nationale paginée à distance. Le fond natif revient dès que la vue déclarée déborde du pilote (notamment au dézoom), afin de ne pas exposer de tuiles absentes. Les limites exactes du rendu incliné doivent encore être contrôlées sur appareil. L'option « Atlas VESTIGE » permet de retrouver le fond de la V2 à tout moment. Hors pilote, le cache hors ligne du fond natif dépend du fournisseur et n'est pas garanti.

MapLibre Native permettrait des extrusions vectorielles personnalisées, mais nécessiterait une development build et une source de tuiles avec droits et disponibilité à étudier. Mapbox nécessite également une intégration native et une étude des jetons, quotas et tarifs. Aucun compte, abonnement ou service de ce type n'est activé.

## Fonctionnalités implémentées

- 35 lieux au total : 8 identifiants et récompenses historiques conservés, 27 nouveaux lieux validés dans une liste éditoriale sourcée.
- Secteur Vienne, Saint-Romain-en-Gal, Sainte-Colombe ; quelques lieux de Seyssuel, Septème et Chonas-l'Amballan. Les quatre lieux de Lyon restent présents.
- Marqueurs regroupés selon le zoom, agrandissement au toucher, choix individuel si des points restent proches à fort zoom.
- États à explorer, à documenter, à portée, découvert et sélection éditoriale. Une fiche courte n'est pas présentée comme une histoire détaillée vérifiée.
- Fiches : catégorie, texte sourcé lorsqu'il existe, références, coordonnées/provenance, alias, photos/attributions, repères chronologiques uniquement lorsqu'une date de création précise est fournie par Wikidata, suggestions géographiques à moins de 1,2 km. Proximité ne signifie pas lien historique ou accès public.
- 25 nouvelles photographies Commons dont la licence réutilisable et l'auteur sont conservés. Pour les deux autres nouveaux lieux : emplacement « Photo à documenter ». Les 8 photos initiales restent présentes.
- Avatar, marche, cap fiable, halo, suivi GPS, arrêt du suivi par geste et recentrage conservés. Retour visuel de découverte enrichi par l'animation de l'emblème, en respectant Réduire les animations.
- Carnet SQLite : migration transactionnelle unique du journal AsyncStorage `vestige.journal.v1`, qui n'est pas supprimé ; identifiant unique par découverte ; récompense enregistrée avant confirmation. XP stockés au moment de l'attribution pour éviter qu'une évolution du catalogue ne modifie les gains passés. Un journal illisible bloque la migration au lieu de repartir silencieusement à zéro.
- Les succès existants restent liés aux lieux des parcours initiaux : ajouter un monument ne déverrouille pas arbitrairement un ancien succès.

Les 14 éléments demandés sont couverts par 12 fiches distinctes : temple, théâtre, Cybèle, pyramide, odéon, cathédrale, Saint-André-le-Bas (église + cloître), Saint-Pierre, chapelle de Pipet, château de la Bâtie, musée + site de Saint-Romain-en-Gal, palais du Miroir. Le musée et le site constituent une même découverte ; idem pour l'église et son cloître. Le point de Pipet est celui de la chapelle, pas celui de la colline. Le point de la pyramide est issu de son emprise OSM, pas d'un centre approximatif du cirque.

## Sources et import réutilisable

- OpenStreetMap / Overpass : géométries et identifiants, ODbL 1.0 ; attribution sur la carte et lien vers https://www.openstreetmap.org/copyright. Extrait source conservé pour permettre la redistribution et la régénération sous ODbL. Les tuiles sont une œuvre cartographique produite à partir de cet extrait.
- Wikidata : coordonnées, identifiants Mérimée, dates, liens, CC0 ; identifiants Q conservés.
- Wikipédia francophone : extraits de pages identifiées, CC BY-SA 4.0 ; liens vers les pages pour l'historique et les auteurs. Aucun récit ajouté pour combler une absence de source.
- Wikimedia Commons : photos avec métadonnées de licence et auteur ; fichiers, attribution et page originale conservés dans `data/import/photos.json` et les fiches. Les auteurs ne sont pas remplacés par « Commons ».
- POP/Mérimée : références officielles PA/IA issues de Wikidata et liens directs. Aucun texte ni image POP copié. L'ancien endpoint consulté renvoie désormais une page HTML ; un import POP complet avec schéma et droits validés reste à faire. L'adaptateur CSV ne fait que préparer une file de revue.

Les données brutes, la file de 82 candidats, les 27 décisions explicites et le rapport sont dans `data/import`. Les coordonnées sont validées et leur provenance conservée. Les entités Wikidata sont dédupliquées ; les alias regroupent les parties d'un même ensemble. Un lieu OSM n'est pas assimilé automatiquement à un Monument historique classé. La protection officielle n'est pas déduite d'un nom ou d'une catégorie.

Commandes de maintenance (Python 3 ; Pillow uniquement pour le rendu de l'atlas) :

```powershell
python scripts/heritage/import_pois.py candidates
# Examiner data/import/candidates.json, puis modifier review.json avec une source et une note.
python scripts/heritage/import_pois.py build
# Réseau uniquement à la demande ; une limitation HTTP 429 arrête l'import sans boucle de relance.
python scripts/heritage/import_pois.py fetch-wiki
python scripts/heritage/import_pois.py fetch-osm
python scripts/heritage/import_pois.py pop-csv --file .\export-officiel.csv
python scripts/heritage/fetch_photos.py
python -m pip install Pillow
python scripts/heritage/render_atlas.py
```

Un import n'est pas une publication : il faut relire les différences, licences, coordonnées, alias et décisions avant une nouvelle version. Les changements de source ne sont pas téléchargés automatiquement sur les téléphones. Les collections de photos sont un cache versionné ; ne relancer leur téléchargement que pour une mise à jour volontaire.

## Tester sous Windows avec Expo Go

Cette version garde Expo Go : react-native-maps, expo-sqlite et expo-file-system utilisent les modules du SDK Expo installé. Aucune development build n'est requise pour ces fonctionnalités. Installer la version d'Expo Go qui prend en charge le SDK 58 du projet ; Expo Go et le projet doivent utiliser des versions compatibles.

La branche V3 est **locale et non publiée**, conformément à la consigne. Les anciennes branches GitHub ne contiennent donc pas ces changements. Après une autorisation explicite de transfert, une branche GitHub permettra de récupérer le ZIP ou de faire un checkout. En attendant, les fichiers locaux restent dans `/workspace/work/vestige-v3` et l'archive préparée est `/workspace/work/vestige-v3.zip`. Ces chemins Cloud ne sont pas des URL de téléchargement Windows.

Une fois le dossier complet récupéré, installer Node.js 24 LTS puis ouvrir PowerShell :

```powershell
cd "$HOME\Downloads\vestige-v3"
npm ci
npm run typecheck
npm test
npx expo start --clear
```

Utiliser votre chemin réel si l'archive est extraite ailleurs. Le dossier courant doit contenir `package.json`. Ne pas copier `node_modules` de Linux vers Windows : `npm ci` réinstalle les dépendances adaptées. PC et iPhone sur le même Wi-Fi ; autoriser Node.js sur le réseau privé dans le pare-feu Windows. Installer/ouvrir Expo Go sur l'iPhone et scanner le QR depuis l'appareil photo.

Si le Wi-Fi isole les appareils :

```powershell
npx expo start --tunnel
```

Le tunnel peut demander l'installation de l'outil ngrok ; aucune souscription payante n'est requise pour le premier essai. Si vous ne souhaitez pas l'installer, conserver le mode Wi-Fi local. Le GPS se teste dehors avec « Position exacte » autorisée. Dans Explorer → options, choisir Vienne ou Saint-Romain-en-Gal pour consulter le pilote ; cela ne déplace jamais votre position réelle. Valider une découverte exige d'être réellement à moins de 100 m, avec un relevé de moins de 30 s et une précision de 50 m ou mieux.

Scénario iPhone à effectuer : préparer l'atlas en Wi-Fi, consulter les nouveaux lieux et leurs sources, zoomer/dézoomer les groupes, incliner/tourner/panoramiquer puis recentrer ; marcher et vérifier l'avatar ; découvrir réellement un lieu puis redémarrer Expo Go pour vérifier carnet et XP ; désactiver le réseau après préparation et vérifier l'atlas local ; refuser le GPS puis le réautoriser ; vérifier aussi Lyon et le retour au fond natif. Conserver le même projet Expo et ne pas vider ses données pour vérifier la migration.

## Vérification et limites

Tests automatisés : logique GPS existante, avatars/assets, identité visuelle, succès, nouvelle migration SQLite transactionnelle, corruption, refus de double récompense, regroupement de points et coordonnées/provenance du nouveau catalogue. TypeScript, ESLint et export des bundles natifs iOS/Android complètent les contrôles. Un export ne remplace pas un test sur appareil.

Aucun iPhone ou Android physique n'est connecté ici : fluidité, consommation, relief natif, affichage réel LocalTile et GPS en promenade restent à mesurer sur appareil. Pas de faux relevé de performance. Une première copie de 1 118 petits fichiers peut être lente dans Expo Go ; la carte native reste disponible. Les données disponibles hors connexion concernent le pilote et les fiches embarquées ; le chargement initial Expo Go exige encore Metro. Pas de synchronisation de compte ou sauvegarde cloud. Revenir à la V2 conserve son ancien journal AsyncStorage, mais les découvertes SQLite faites ensuite en V3 ne sont pas répliquées vers la V2. Ne pas désinstaller l'application/effacer ses données pour sauvegarder le carnet.

Restent : revue historique approfondie et chronologies plus riches pour les fiches minimales, entrées/accessibilité/horaires officiels, import POP intégral, couverture Lyon et France à grande échelle, stockage distant/modération éditoriale, import incrémental paginé, mesures sur iPhone, véritable extrusion vectorielle si une development build est acceptée. Les parcours guidés initiaux restent conservés ; les nouvelles fiches sont explorables librement mais n'ont pas toutes un parcours scénarisé.

## Fichiers principaux

- `src/app/(tabs)/index.tsx` : atlas, vue visible, groupes, choix des lieux ; `MapOptions.tsx` : sélection du fond et destinations.
- `src/hooks/useLocalAtlas.ts`, `src/data/atlasTiles.ts`, `assets/atlas/*` : préparation/carte locale.
- `src/lib/mapViewport.ts`, `markerState.ts`, `HistoricalMarker.tsx` : regroupement et états.
- `src/data/monuments.ts`, `src/data/generated/*`, `assets/monuments/v3/*` : catalogue/photos ; `scripts/heritage/*`, `data/import/*` : sources, import, modération.
- `src/components/monuments/MonumentDetails.tsx`, `DiscoveryNotice.tsx`, `src/components/MonumentPhoto.tsx`, `ui.tsx` : fiches, photos et retour de découverte ; pages Carnet et Parcours : utilisation des photos et villes.
- `src/lib/progress.ts`, `progressDatabase.ts`, `store.tsx`, `achievements.ts` : SQLite, migration, récompenses.
- `app.json`, `package.json`, `package-lock.json` : modules Expo ; `tests/v3.test.ts` : nouveaux contrôles.

L'original du logo, les sprites de l'avatar, les deux parcours et les huit identifiants initiaux sont préservés.
