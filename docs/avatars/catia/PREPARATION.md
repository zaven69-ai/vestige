# Catia — préparation mobile du 10 novembre 2026

Branche locale : `codex/catia-mobile-preparation`, issue du prototype avatars et de la réception du modèle original. Aucune publication ni génération payante. Catia reste désactivée sur la carte.

## Résultat concret

Le GLB original `assets/avatars/source/catia/avatar.glb` est strictement inchangé : SHA-256 `9c3e5b819423af36553d94b7fc01d7e1f4c4f8ad721074b5e23eb2f01055966c`. L'intégrité est vérifiée par script et par les tests. Toutes les transformations et simplifications ont lieu sur des copies.

| Fichier | Triangles | Taille | État |
|---|---:|---:|---|
| Original | 151 692 | 5 101 952 octets | Préservé, statique |
| `mobile/catia-30000.glb` | 29 996 | 1 464 540 octets | Variante plus détaillée, statique |
| **`mobile/catia-25000.glb`** | **24 996** | **1 351 192 octets** | **Base mobile retenue**, statique |
| `mobile/catia-20000.glb` | 19 995 | 1 236 068 octets | Variante légère, statique |
| `rig-lab/catia-motion-trials.glb` | 24 996 | 1 726 668 octets | Vrai rig et vrais clips, expérimentaux, non approuvés |

Les chemins du tableau sont relatifs à `assets/avatars/catia/`, sauf l'original. La base retenue réduit la géométrie d'environ 83,5 % et le fichier d'environ 73,5 %. La variante 20k n'est pas utilisée automatiquement ; aucune logique de LOD temps réel n'est activée.

## Fidélité visuelle

Blender 4.3.2 a normalisé une copie à 1,75 m, pieds au sol, orientation glTF +Z avant / +Y haut. La simplification pondérée pénalise davantage les suppressions d'arêtes sur la tête, les cheveux et les bottines. Les UV et le matériau sont conservés. La texture JPEG 2048×2048 est **identique octet pour octet dans les trois GLB statiques** : SHA-256 `22b4e0d976480b4da6273ba32cd7f2f3e39e6f538b8b100b76cdb709a2161dcf`.

Les comparaisons `comparison/original-*.png`, `30000-*.png`, `25000-*.png` et `20000-*.png` utilisent le même éclairage, le même cadrage et les mêmes vues face/profil/dos/visage. Le visage, les cheveux blonds lisses, le blazer camel, le pantalon et les bottines sont conservés ; la géométrie est réellement simplifiée, donc une identité parfaite de chaque sommet n'est pas revendiquée. Les rendus du visage original/25k ont été comparés visuellement. La validation artistique finale reste à faire, notamment pendant les déformations.

## Squelette et animations : état réel

**Les outils disponibles permettent de créer un rig et des animations.** Le projet Blender `rig-lab/catia-rig-workbench.blend` contient un squelette expérimental de **17 os**, le skin et les actions. Le GLB `catia-motion-trials.glb` contient un skin glTF et trois animations utilisables par un lecteur glTF :

| Clip | Durée cible à 24 fps | Canaux effectivement variables dans le GLB | Validation de production |
|---|---:|---:|---|
| `idle` | 3 s | 2 | Essai de respiration/mouvement de tête ; revue manuelle encore nécessaire |
| `walk` | 1 s | 11 | **Refusé à ce stade : étirements excessifs** |
| `run` | 0,75 s | 11 | **Refusé à ce stade : étirements excessifs** |

Ce ne sont pas des noms de clips vides : l'audit lit leurs valeurs binaires et confirme des transformations réellement variables. Les mouvements sont des essais procéduraux originaux, pas des animations reprises d'un autre jeu. Ils ne doivent pas être présentés comme une marche/course naturelle finalisée.

La première pondération automatique sur le modèle 30k laissait 100 sommets sans poids. Sur la base 25k, 91 sommets restaient sans poids ; leurs pondérations ont été transférées depuis les sommets pondérés les plus proches, à au plus 1,97 cm. Ensuite, les poids des sommets coïncidents aux coutures UV ont été harmonisés et limités à 4 influences par sommet. Résultat : **100 % des 16 122 sommets exportés sont pondérés**, avec sommes de poids normalisées. Cela ne prouve pas la qualité anatomique du skinning.

Les coutures synchronisées restent à moins de 0,02 mm dans les poses échantillonnées. Les contrôles grossiers de pénétration du sol passent avec une tolérance de 2 cm, mais ne valident ni les appuis talon/pointe ni le glissement des pieds. Le contrôle d'étirement au 99e percentile dépasse son seuil de 2× pour Walk (≈2,01×) et Run (≈3,81×). Les rendus de contrôle montrent aussi des plis/déformations non satisfaisants aux jambes. Les résultats négatifs restent consignés dans `rig-audit.json`.

Le rig est ajusté approximativement à la pose d'origine, bras baissés et mains près des poches. Il n'est pas un retarget validé du squelette en T partagé ; des noms d'os identiques ne garantissent pas des axes de repos compatibles. Pas de rig facial détaillé ou de doigts indépendants. Le modèle reste un maillage reconstruit ; il faut vérifier les zones de contact entre mains, poches, veste et sac.

### Étape manuelle nécessaire avant production

Dans Blender, un artiste/animateur doit :

1. Vérifier l'emplacement et l'orientation des articulations, surtout genoux, épaules, chevilles et talons.
2. Corriger au besoin la topologie et les contacts mains/poches/veste pour permettre le mouvement sans tirer le pantalon ou la veste.
3. Reprendre les poids au niveau des genoux, hanches, sac et cheveux ; conserver la continuité des coutures.
4. Corriger/retargeter les cycles Walk et Run avec appuis de pieds crédibles, absence d'interpénétrations et boucles naturelles ; revoir Idle.
5. Valider les vues en mouvement et exporter un nouveau GLB, puis mesurer sur iPhone/Android.

**Cette étape n'exige pas une nouvelle génération Krea ou un abonnement.** Blender gratuit suffit comme outil ; la limite actuelle est la qualité du rigging/animation automatique sur ce maillage posé. Le fichier de travail et les diagnostics sont fournis pour cette reprise.

Ouvrir `catia-rig-workbench.blend` : Idle est sélectionné par défaut, images 1–73 à 24 fps. Pour examiner Walk ou Run, sélectionner l'action correspondante dans l'éditeur d'actions et régler la fin à 25 ou 19. Les pistes NLA sont laissées muettes pour éviter de superposer les trois cycles ; utiliser une seule action à la fois. Les fichiers `docs/avatars/catia/rig-lab/*.png` sont des poses d'essai, pas des captures iPhone.

## Préparation React Native / Expo

L'application conserve Expo SDK 58 et ses dépendances existantes : aucune migration native, aucun moteur 3D ou service externe ajouté.

Parcours : **Profil → Choisir mon explorateur → Examiner Catia**. Une nouvelle route `/catia` affiche des vues du GLB statique retenu, son état réel et les validations manquantes. Ce sont des images de contrôle 2D calculées depuis le modèle 3D ; la route ne prétend pas afficher un personnage 3D interactif ou des animations validées.

Les GLB statiques et animé sont autonomes, avec texture embarquée, préparés pour un futur lecteur glTF/GLB mobile compatible. Cette livraison ne valide pas leur rendu temps réel dans un lecteur natif iPhone. Les modèles et le fichier Blender ne sont pas importés par le JavaScript de la carte : seuls quatre PNG d'aperçu sont embarqués pour ce nouvel écran.

Catia est **absente des choix activables et du registre des sprites de carte**. Le choix `catia` est rejeté par la persistance actuelle ; aucun bouton d'activation n'est ajouté. Les indicateurs de validation artistique, déformation et essais iOS/Android restent faux. Les fonctions de carte, avatar actuel, GPS, carnet, découvertes, XP et interactions ne sont pas modifiées. Le moteur existant ne lit encore que les phases Idle/Walk ; Run reste à intégrer après validation, avec un déclenchement fondé sur un déplacement GPS fiable.

## Tester sous Windows / iPhone

La branche est locale et non publiée. Après récupération du projet complet, dans le dossier contenant `package.json` :

```powershell
npm ci
npm run catia:audit
npm run typecheck
npm test
npx expo start --clear
```

Avec Expo Go compatible SDK 58, PC et iPhone sur le même Wi-Fi, scanner le QR. Examiner les quatre vues de Catia, revenir à Explorer et vérifier que l'avatar actuel n'a pas changé, que le GPS fonctionne et que le carnet/XP sont conservés. Ne pas désinstaller l'app ou effacer ses données. La présence des fichiers GLB dans le projet ne les active pas.

Aucun appareil physique n'est connecté ici. Les performances GPU, mémoire, batterie, fluidité de Catia animée, matériau PBR et contacts au sol sur iPhone/Android restent à mesurer. Un export Hermes ne prouve pas ces points.

## Scripts et reproductibilité

- `scripts/avatars/catia/optimize.py` : copie normalisée, trois budgets, protection des zones détaillées, rendus comparatifs. Refuse d'écraser un résultat de comparaison existant. `--output` et `--renders` permettent de choisir de nouveaux dossiers.
- `scripts/avatars/catia/rig_lab.py` : repères de rig expérimentaux, poids automatiques, réparation limitée, harmonisation des coutures, véritables clés Idle/Walk/Run, export et contrôles. Refuse d'écraser un audit déjà présent ; archiver le dossier d'essai avant de recommencer. Il n'approuve ni n'enregistre Catia sur la carte.
- `scripts/avatars/catia/audit.mjs` : vérifie l'original, les budgets, la texture, la structure GLB, les poids et les animations réellement variables. Régénère le rapport et le statut d'aperçu, toujours non activé.
- `tests/catia.test.ts` : contrôles des fichiers réels, des coutures et du blocage de sélection/activation.

```powershell
blender --background --python scripts/avatars/catia/optimize.py
blender --background --python scripts/avatars/catia/rig_lab.py
npm run catia:audit
```

Ces commandes sont destinées à la maintenance ; les résultats étant déjà livrés, ne pas relancer les étapes Blender dans les mêmes dossiers sans en préserver les versions. Le logiciel travaille localement sur CPU, sans génération distante ni frais d'API.

## Fichiers créés principaux

- `assets/avatars/catia/mobile/` : trois GLB statiques et `optimization.json`.
- `assets/avatars/catia/rig-lab/` : GLB animé expérimental, fichier Blender éditable et `rig-audit.json`.
- `assets/avatars/catia/previews/` : quatre PNG pour Expo Go.
- `docs/avatars/catia/comparison/`, `rig-lab/`, `technical-audit.json` et le présent guide : preuves et limites.
- `src/app/catia.tsx`, `src/data/avatars/catia.json`, `src/lib/avatars/catia.ts` : aperçu et critères de préparation.
- `scripts/avatars/catia/*`, `tests/catia.test.ts` : chaîne de préparation et vérifications.

Fichiers existants modifiés : `src/app/avatars.tsx` pour l'accès à l'aperçu, `package.json` pour la commande d'audit et la documentation. L'original Catia et la logique GPS/XP ne sont pas modifiés.
