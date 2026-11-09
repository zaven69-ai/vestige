# Vestige — prototype Alex/Léa et chaîne d'assets 3D

## État exact de cette livraison

Branche locale `codex/avatar-3d-prototype`, basée sur la V3 `e2014e0`. La carte historique, le GPS, les découvertes, les XP, le carnet SQLite et l'avatar existant restent présents. Aucune publication, dépense ou migration native n'a été effectuée.

**Cette livraison prépare l'intégration ; elle ne contient pas encore les modèles ni les nouveaux visuels Alex et Léa.** Ne pas confondre l'atelier fonctionnel avec un rendu final des personnages. Aucun PNG existant n'est renommé Alex/Léa, aucune silhouette approximative n'est créée pour les remplacer. Le rendu actif reste explicitement « avatar actuel ».

Fonctionne dans le code : Profil → « Choisir mon explorateur » → fiches des six personnages ; préférence Alex/Léa/actuel sauvegardée séparément dans AsyncStorage ; retour au choix après redémarrage ; banc d'animation avec attente/marche et orientations de l'avatar actuellement disponible. Les commandes de démonstration n'affectent jamais le GPS. Les animations de l'atelier s'arrêtent lorsque l'écran perd le focus, lorsque l'app passe en arrière-plan ou lorsque Réduire les animations est activé. Les packs validés seront utilisés par la carte, le profil et le HUD via le même registre.

Manque pour montrer réellement Alex/Léa : deux maillages humains habillés et texturés, riggés et animés, fidèles à la référence, ainsi que la validation artistique de leurs rendus. Aucun modèle de cette qualité n'était fourni dans le projet. Blender 4.3.2 est disponible et la chaîne technique est préparée ; sa présence ne transforme pas une illustration en personnage prêt à animer.

## Analyse de la référence

La planche jointe montre des adultes aux proportions proches du réel, des visages détaillés et expressifs, des tissus et des coutures crédibles, des sacs fonctionnels et des appareils lumineux peu encombrants. Les silhouettes restent identifiables par la chevelure, les couches de vêtements, la couleur de la veste et le type de sac. Les détails très fins doivent être simplifiés pour la carte, pas remplacés par des traits cartoon. La cohérence vient du même niveau de stylisation, de l'éclairage doux et des matières, pas de vêtements identiques.

De gauche à droite : Alex bleu nuit et turquoise ; Léa violet/corail avec cheveux attachés ; Noa clair avec accessoires numériques ; Camille beige, lunettes et tablette ; Sam corail/turquoise avec casque ; Nova sombre/violet et cheveux argentés. Ce sont des références de personnages originaux, pas des assets d'un jeu tiers.

La planche reste visible dans la conversation ; elle n'est pas accessible comme fichier image original local. Le cahier des charges est conservé dans `brief-officiel.txt`. Aucun modèle 3D ne peut être extrait directement de cette illustration. Le logotype blanc de la planche n'est pas substitué au logo officiel installé dans l'application ; ce dernier reste inchangé.

## Fiches techniques réutilisables

Les mêmes informations sont disponibles dans `src/lib/avatars/catalogue.ts` et dans l'atelier.

| Personnage | Silhouette / tenue | Accessoires / lecture sur carte | Statut |
|---|---|---|---|
| Alex, explorateur urbain | Jeune adulte ; cheveux bruns courts ondulés ; veste bleu nuit, haut sobre, cargo sombre, sneakers | Sac compact, montre ; accents turquoise, allure accessible | Prototype à produire |
| Léa, aventurière | Jeune adulte ; cheveux châtains attachés ; veste violette/corail, pantalon technique, randonnée moderne | Sac et navigation ; queue de cheval et veste distinctives | Prototype à produire |
| Noa, voyageur du temps | Jeune adulte ; cheveux bruns foncés ; veste blanche/bleu électrique, sweat et cargo | Bracelet et hologramme discret ; veste claire reconnaissable | Après validation Alex/Léa |
| Camille, archéologue moderne | Adulte ; cheveux bruns ondulés, lunettes ; veste beige de terrain, bottines | Sacoche et tablette ; veste plus longue | Après validation Alex/Léa |
| Sam, aventurier dynamique | Jeune adulte ; cheveux courts bouclés ; veste corail, pantalon sombre, sneakers turquoise | Sac, casque urbain ; expression positive | Après validation Alex/Léa |
| Nova, exploratrice d'élite | Adulte ; cheveux argentés ; tenue sombre, détails violets, bottes | Bracelet lumineux et équipement avancé ; allure stratégique | Cosmétique future, sans avantage de jeu |

Règles communes : proportions adultes naturelles d'environ 7,5 têtes, variations morphologiques crédibles, même qualité de visage/mains et de textures, mêmes conventions d'échelle et d'animation. Les tailles ne sont pas uniformisées en déformant les corps. Pas d'armure fantasy ni de surenchère d'hologrammes. Couleurs d'identité #020D27, #0B1B3D, #A454ED, #F77B54, #32BCC0 ; le beige et le blanc sont des matières de tenues, pas une modification de la charte UI.

## Solution technique retenue pour le prototype

**Modèles source réellement 3D → animations du même squelette → rendus transparents Blender → sprites sur la carte native.**

Les fichiers GLB restent la source de vérité, réutilisable pour une future vue 3D. À l'exécution, la carte reste en 2D/2,5D : pas de moteur 3D dans chaque marqueur, pas de canevas GL par personnage, pas de nouvelle dépendance native. Un sprite issu d'un GLB est toujours un rendu 2D, jamais un modèle 3D interactif. Cette approche conserve Expo Go et les animations GPS existantes.

Une prévisualisation 3D interactive isolée pourra être étudiée avec expo-gl/Three.js après obtention des modèles et validation sur iPhone. Une vraie intégration spatiale de personnages dans les bâtiments demanderait une étude du moteur cartographique et probablement une development build ; elle n'est pas activée ici. Ni la persistance du carnet ni les règles XP n'ont besoin d'être modifiées pour des cosmétiques.

## Architecture d'assets

```text
assets/avatars/
  contract.json                  # règles communes machine-readable
  source/
    vestige-humanoid-v1.blend     # squelette commun, sans personnage ni animation
    README.md
    alex/avatar.glb              # à fournir ; absent actuellement
    alex/provenance.json        # auteur, droits, origine
    lea/avatar.glb               # à fournir ; absent actuellement
    lea/provenance.json
  characters/
    alex/pack.json               # créé par Blender, non approuvé au départ
    alex/portrait.png
    alex/{direction}-{phase}-{frame}.png
    lea/...
src/data/avatars/packs.ts        # registre de require statiques validés ; vide actuellement
src/lib/avatars/                 # fiches, types et préférence indépendante
scripts/avatars/                 # validation GLB, rendu Blender, enregistrement des packs
```

Le registre reste vide tant qu'aucun pack complet n'est approuvé. Une préférence enregistrée peut être « en attente » ; l'avatar historique reste alors actif. Le cache des assets est identifié par personnage, empreinte source et orientation pour ne pas mélanger Alex/Léa après un changement. Les erreurs de lecture/sauvegarde ne modifient pas le carnet ou les XP et ne remplacent pas silencieusement une préférence illisible.

### Contrat source et rendu

- GLB 2.0 autonome, textures embarquées, sans dépendances distantes ou extensions de décompression dans cette première chaîne Blender.
- Mètres, hauteur comprise entre 1,55 et 1,95 m ; glTF +Y en haut et +Z vers l'avant ; pieds au sol, origine centrée. Conversion glTF/Blender par l'importeur standard.
- Squelette `vestige-humanoid-v1` : 17 os canoniques nommés dans `contract.json`. Le fichier Blender fourni définit la pose en T, les axes et la hiérarchie de départ ; il ne contient aucun personnage ni animation. `scripts/avatars/create_rig_template.py` permet de le régénérer dans un nouveau dossier sans écraser une version existante. Clavicules, doigts et orteils supplémentaires possibles. Un squelette Mixamo/VRM différent doit être retargeté avant ce contrat, pas simplement renommé si les axes/poses diffèrent.
- LOD0 cible 20–35k triangles, GLB source ≤12 Mo, textures ≤2048 px. LOD1 8–12k et LOD2 2–4k sont des objectifs futurs, pas des fichiers livrés. Les rendus embarqués utilisent les PNG ; les compressions KTX2/Draco d'une future vue 3D restent à étudier séparément.
- Clips obligatoires `idle` et `walk`, animés sur place ; pas de déplacement horizontal de la racine >5 cm dans les poses échantillonnées. Les coordonnées restent exclusivement gérées par le GPS.
- Rendus de carte 160×208 px RGBA, taille logique 80×104 pt ; ancrage pieds à (80,182) px. Même cadrage et éclairage pour tous ; pas de recadrage différent à chaque image.
- Huit orientations réelles + `unknown` neutre de face ; 4 images idle à 700 ms et 6 images walk à 125 ms, pour rester compatibles avec le moteur actuel. C'est un premier budget léger ; augmenter le nombre de poses pour une marche plus fluide nécessitera une évolution versionnée du contrat/lecteur, après mesure mémoire et CPU.
- Portrait 256×256 RGBA, issu du même modèle, avec cadrage dédié. Pas de visage créé séparément qui changerait d'identité.

Le validateur Node contrôle la structure GLB, le skin, les noms d'os, les animations, le budget de triangles et les dépendances embarquées. Il ne remplace pas un validateur glTF complet ni une revue artistique. Blender contrôle aussi les dimensions des textures, l'échelle, le sol, les poses hors cadre et la racine sur les images échantillonnées. Une déformation entre deux échantillons peut encore nécessiter une correction manuelle.

### Animations

| Clip | Source 3D attendue | Application actuelle |
|---|---|---|
| Idle | Respiration et légers ajustements, boucle fermée | Lecteur existant prêt ; nouveaux clips à fournir |
| Walk | Marche sur place cohérente avec le squelette | Sur la carte seulement après deux relevés fiables ; expiration sans nouveau déplacement |
| Run | Course légère | Prévu, non branché |
| Turn | Transition corporelle progressive | Prévu ; orientations actuelles discrètes, pas de rotation corporelle 3D fluide |
| Discover | Geste court de découverte | Prévu ; retour de découverte UI de la V3 conservé |
| Celebrate | Récompense / niveau | Prévu ; retour de niveau UI de la V3 conservé |

Les démonstrations de marche dans l'atelier sont explicitement des tests visuels, jamais des relevés GPS. Aucun clip de marche n'est lancé en continu sur la carte à l'arrêt. L'interpolation de déplacement du marqueur, la direction fiable et le cercle de découverte restent ceux du projet existant. La taille sur carte reste fixe pour la lisibilité dans ce prototype ; une variation avec zoom/perspective n'est pas encore ajoutée.

## Produire les modèles et les intégrer

Outils gratuits possibles : Blender pour modélisation, retopologie, UV, textures, rigging, retargeting et rendu ; Krita pour les textures. Un modèle humain de base externe doit avoir une licence compatible, avec son attribution conservée ; aucun modèle téléchargé n'est livré ici. Le rigging/skin et la revue des visages et vêtements demandent un travail artistique. Ne pas approuver une figure générée avec mains, visage, pieds ou anatomie incorrects.

Krea dispose de générateurs 3D. Les modèles disponibles et le schéma Hunyuan3D 3.1 Pro ont été consultés en lecture seule. Ce schéma propose du maillage et des textures, pas une garantie de squelette/animations humanoïdes ; son minimum de faces exige aussi une optimisation vers le budget Vestige. Aucun tarif plafonné ni génération n'a été accepté : aucun crédit consommé, aucune image envoyée à ce service. Une éventuelle génération doit partir de références individuelles propres d'Alex et Léa, pas de la planche complète à six personnages, puis passer par la retopologie, le rigging et la validation.

Une fois les **vrais** GLB préparés, dans PowerShell depuis la racine du projet :

```powershell
node scripts/avatars/validate-glb.mjs assets/avatars/source/alex/avatar.glb
# Blender 4.3+ doit être installé et sa commande disponible.
blender --background --python scripts/avatars/render_blender.py -- --character alex
node scripts/avatars/validate-glb.mjs assets/avatars/source/lea/avatar.glb
blender --background --python scripts/avatars/render_blender.py -- --character lea
```

Si Blender n'est pas dans PATH, appeler son exe avec `& "C:\Program Files\Blender Foundation\Blender 4.3\blender.exe" ...` selon votre installation. Le rendu est CPU, local et sans appel réseau. Le débruitage est désactivé par défaut pour les builds Blender dépourvus d’OpenImageDenoise ; `--denoise` est optionnel lorsque ce composant est disponible. Il produit un pack non approuvé et refuse d'écraser un dossier existant. Garder/archiver les versions avant toute nouvelle exportation. En cas d'échec, un dossier partiellement rendu peut rester ; il n'est pas enregistré automatiquement.

Avant d'enregistrer un pack, examiner toutes les vues, animations, le visage, les cheveux, les mains, les pieds, le sac, les silhouettes côte à côte et l'apparence à 80×104 pt. Contrôler l'identité par rapport à la référence et les licences. Renseigner `artApprovedBy`, `artApprovedAt` et `license` dans `pack.json` **uniquement après cette validation**. Conserver la provenance du GLB. L'empreinte source doit correspondre au rendu ; changer le GLB impose un nouveau rendu/revue.

```powershell
npm run avatars:register
npm run typecheck
npm test
npx expo start --clear
```

L'enregistrement vérifie tous les packs avant de modifier le registre. Un pack incomplet, non approuvé ou associé au mauvais GLB est refusé ; il ne remplace pas le registre fonctionnel. Après intégration réelle, la préférence Alex/Léa sera appliquée à la carte, au profil et au HUD. Les autres quatre personnages restent désactivés jusqu'à leur phase de production.

## Tester le prototype actuel sur iPhone

Cette branche n'est pas publiée ; elle ne se trouve pas encore sur GitHub. Après récupération du dossier complet et installation de Node 24 :

```powershell
cd "C:\chemin\vers\vestige-avatars-3d"
npm ci
npm run typecheck
npm test
npx expo start --clear
```

PC/iPhone sur le même Wi-Fi, Expo Go compatible SDK 58 ; scanner le QR avec l'appareil photo. Ouvrir Profil → Choisir mon explorateur ; choisir Alex puis sauvegarder ; revenir à la carte (l'avatar actuel reste affiché, comme annoncé) ; relancer l'app et vérifier la préférence ; faire de même avec Léa ; revenir à « Conserver l'avatar actuel ». Tester attente/marche/directions dans l'atelier, puis GPS réel à l'extérieur, carnet et XP. Ne pas désinstaller ou effacer les données pour ce test. Aucun abonnement ou moteur natif supplémentaire n'est nécessaire.

## Vérifications et limites

Les tests de logique portent sur les préférences, la cohérence du contrat avec l'ancrage et les images existantes, le rejet d'une image prétendant être un GLB, des skins/clips manquants, des textures externes et des packs non approuvés et des PNG tronqués. Les tests V3 de GPS, carnet SQLite et récompenses restent requis. Lint et TypeScript doivent passer ; exports natifs iOS/Android à vérifier.

Un modèle technique de test (bloc riggé, pas un personnage) sert à vérifier la chaîne Blender hors des assets livrés. Il ne représente ni Alex ni Léa et ne doit jamais apparaître dans l'application. Aucun test visuel de personnage réel ou benchmark iPhone n'est revendiqué : il manque les modèles et aucun appareil physique n'est connecté.

## Fichiers modifiés

- `src/app/avatars.tsx`, `src/components/avatars/AvatarPreview.tsx` : atelier et banc d'animation.
- `src/lib/avatars/*`, `src/data/avatars/packs.ts` : fiches, contrat de pack et préférence locale indépendante.
- `src/app/_layout.tsx`, `src/app/(tabs)/profil.tsx` : fournisseur de préférences et accès à l'atelier.
- `ExplorerAvatar.tsx`, `PlayerMarker.tsx`, `avatar/useAvatarAssets.ts` : lecture du pack validé partagé et préchargement par identité/orientation.
- `assets/avatars/contract.json`, `source/README.md`, `scripts/avatars/*` : contrat, validation, rendu et enregistrement.
- `tests/avatar-prototype.test.ts`, `package.json`, `.gitignore`, `README.md`, `docs/avatars/*` : contrôles, commandes et documentation.

Aucune modification de `store.tsx`, `progress.ts`, de la base SQLite ou des règles de découverte n'est nécessaire pour cette fonctionnalité cosmétique.
