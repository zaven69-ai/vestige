# VESTIGE — Design system officiel V1

Charte appliquée à la branche `codex/official-brand-v1`, à partir de la V2 immersive existante. Les tokens exécutables sont dans `src/theme/index.ts` ; les composants de base dans `src/components/ui.tsx`.

## Identité

VESTIGE est un jeu mobile de découverte historique. La carte et les lieux restent dominants ; l’identité s’exprime par des surfaces bleu nuit, des accents de progression et des commandes compactes. Les détails historiques apparaissent dans les fiches, parcours et collections.

La référence de logo fournie est une épingle de localisation contenant une colonne antique, avec un dégradé cyan/bleu/violet/rose/orange. **Le logo ne doit être ni redessiné, ni recoloré, ni déformé.** Aucun symbole de remplacement n’a été généré.

### Logo intégré

Le fichier original `assets/brand/vestige-logo.png` a été ajouté par le propriétaire du dépôt. Il mesure 1339 × 1174 px, RGB, et reste inchangé (SHA-256 : `ce19ec5101008381614299b13a867717d1ffaab9736afdd0736670cdbb1e7c9c`). L’autre PNG ajouté, au nom UUID, est identique et a également été conservé.

`src/theme/brandAssets.ts` référence désormais cet original. `BrandSignature` affiche le vrai logo, avec `resizeMode="contain"`, dans les en-têtes et le lancement applicatif. Les exports système sont obtenus uniquement par réduction proportionnelle et ajout de marges : icône opaque 1024 × 1024, foreground adaptatif Android 1024 × 1024 avec contenu centré, favicon 64 × 64. Le splash utilise directement l’original avec `contain`.

Le fond blanc de la source est conservé. Le splash natif et le fond de l’icône adaptative sont blancs pour éviter une suppression ou recoloration de ce fond. Aucune variante monochrome n’a été inventée. `scripts/export_brand_assets.py` permet de reproduire les exports avec Python/Pillow ; `assets/brand/exports.json` décrit dimensions et empreintes. Il n’est pas nécessaire d’installer Python pour lancer l’application.

Les captures Lovable annoncées restent absentes : aucune reproduction précise de ces références n’est revendiquée.

## Palette et rôles

| Token              | Valeur    | Rôle                              |
| ------------------ | --------- | --------------------------------- |
| `colors.bg`        | `#020D27` | Fond général et navigation        |
| `colors.panel`     | `#0B1B3D` | Cartes, panneaux et fiches        |
| `colors.raised`    | `#17294C` | Surfaces interactives secondaires |
| `colors.ink`       | `#FFFFFF` | Texte principal                   |
| `colors.muted`     | `#B4C0D9` | Texte secondaire                  |
| `colors.violet`    | `#A454ED` | XP, niveaux et récompenses        |
| `colors.coral`     | `#F77B54` | Découverte et actions importantes |
| `colors.turquoise` | `#32BCC0` | GPS, validation et succès         |
| `colors.blue`      | `#269DE4` | Exploration et navigation         |
| `colors.line`      | `#304565` | Séparateurs et bordures           |

Les teintes transparentes sont centralisées dans `theme.surfaces`. Le fond cartographique reste clair : pierre froide, routes blanches, eau bleu clair (`theme.map`). Apple Plans et Google Maps n’appliquent pas exactement le même style ; la personnalisation du fond est limitée par leurs capacités natives.

### Dégradé principal

`theme.gradients.primary = ['#A454ED', '#F77B54']`.

Réserver ce dégradé aux boutons principaux et au moment de découverte. Ne pas l’appliquer aux fonds de page, à toutes les cartes ou aux informations GPS.

Le texte des boutons en dégradé est bleu nuit et gras : son contraste atteint au moins 4,5:1 sur les deux extrémités du dégradé. Le texte blanc ne garantit pas ce contraste sur le corail. Les petits badges violets utilisent un texte blanc, avec bordure/fond violet, car le violet en petit texte sur un panneau bleu profond est insuffisamment contrasté. Les grandes statistiques peuvent être violettes.

## Typographie

Police système sans empattement : **SF Pro sur iOS, Roboto sur Android**, avec graisse native adaptée. Choix gratuit, disponible hors ligne et sans chargement réseau. Aucun titre Georgia/serif n’est conservé. Une future fonte Inter embarquée pourra remplacer cette base sans changer les tokens.

| Style            | Taille / interligne  | Utilisation                  |
| ---------------- | -------------------- | ---------------------------- |
| `type.title`     | 28 / 35, graisse 800 | Titre de page ou de fiche    |
| `type.section`   | 20 / 27, graisse 700 | Sections et cartes           |
| `type.monument`  | 17 / 23, graisse 700 | Noms de monuments            |
| `type.body`      | 15 / 23              | Descriptions et explications |
| `type.caption`   | 12 / 18              | Métadonnées secondaires      |
| `type.label`     | 10 / 15, graisse 700 | Courts libellés en capitales |
| `type.statistic` | 30 / 36, graisse 800 | XP et compteurs réels        |

Les commandes de carte emploient une hiérarchie plus compacte. Les textes conservent le redimensionnement système ; contrôler les grands caractères sur iPhone. Les informations essentielles ne reposent pas sur la couleur seule : libellés, symboles et état de validation les accompagnent.

## Géométrie

- Espacement : 4, 8, 12, 16, 20, 24, 32 (`theme.space`).
- Arrondis : 12, 16, 20, 24, pilule (`theme.radius`).
- Cible tactile : au moins 44 pt ; bouton standard : au moins 48 pt.
- Navigation : 64 pt, flottante, décalée au-dessus de la zone sûre inférieure.
- Bordures : 1 pt pour les panneaux ; contraste d’état renforcé pour les sélections.
- Ombre : `theme.shadow`, surtout sur les commandes flottantes et les récompenses.
- Respecter les insets haut/bas/gauche/droite ; le contenu défilant dégage la navigation.

## Composants réutilisables

| Composant                        | Usage                                                                      |
| -------------------------------- | -------------------------------------------------------------------------- |
| `Button`                         | Primaire en dégradé, secondaire bleu ; états pressé/désactivé              |
| `Card`                           | Panneau bleu profond et arrondis cohérents                                 |
| `Badge`                          | Statut, période, ville ou succès ; tons sémantiques                        |
| `ProgressBar`                    | Progression animée et valeurs d’accessibilité                              |
| `XPBar`                          | XP dans le niveau actuel, réutilisé dans le HUD et Profil                  |
| `StatTile`                       | Compteurs provenant de la progression réelle                               |
| `Page`                           | En-tête compact, marque et dégagement de navigation                        |
| `MonumentRow`                    | Photo, nom, période et état de découverte                                  |
| `MapButton` / `ExplorerProfile`  | Commandes compactes sur la carte                                           |
| `HistoricalMarker`               | Période et état du monument                                                |
| `MonumentDetails`                | Contenu unique pour les fiches routées et le panneau de carte              |
| `MonumentBottomSheet`            | Grande fiche native depuis le bas, réduite par bouton/geste sur la poignée |
| `DiscoveryNotice`                | Notification de découverte sauvegardée et de montée de niveau              |
| `BrandSignature` / `BrandLaunch` | Logo officiel dans les en-têtes et le lancement applicatif                 |

Icônes : famille **Ionicons**, contours pour la navigation, validation explicite par coche. Aucune utilisation systématique de l’or. Les badges et compteurs d’un joueur sont calculés à partir de son carnet ; aucune activité communautaire inventée.

## Explorer et monuments

La carte reste plein écran, derrière le HUD et la navigation. Il n’y a aucune grande fiche permanente au démarrage. Un toucher sélectionne un petit aperçu ; son ouverture affiche la fiche en bottom sheet. La fiche existante reste également accessible depuis Carnet et Parcours.

États des marqueurs :

1. **Découvert** : turquoise, coche ; prioritaire sur tous les autres états.
2. **À portée** : corail, point ; uniquement si les conditions GPS réelles sont satisfaites.
3. **Sélection VESTIGE** : violet, étoile ; sélection éditoriale du temple d’Auguste et de Livie et de Fourvière, sans score de rareté ni bonus XP inventé.
4. **À explorer** : bleu lumineux.

Le pictogramme central décrit la période : colonne, bouclier, palette, télescope ou bâtiment. La forme reste compacte et le marqueur sélectionné a une bordure blanche. Les conditions de découverte restent : rayon 100 m, précision ≤ 50 m, relevé de moins de 30 secondes et récompense unique.

L’avatar joueur est désormais un explorateur archéo-tech original en sprites 2.5D : silhouette élancée, veste bleu nuit, sangle corail, scanner turquoise et détails violets. Il reste vertical sur la carte et possède une respiration discrète et une marche conditionnée au GPS. Le logo officiel n’est pas modifié. Voir `docs/AVATAR_DESIGN.md` pour les trois directions proposées, le choix et les limites.

## Progression et animation

- Violet : niveau et XP ; turquoise : succès obtenu ; corail : découverte à réaliser.
- Progression animée sur 260 ms ; entrée de notification sur 380 ms ; déplacement réel de l’avatar sur 650 ms.
- La notification apparaît **après** confirmation de sauvegarde. Son XP est celui du monument ; une montée de niveau est annoncée uniquement si le seuil réel est franchi.
- Pas de confettis permanents, boucle de marche fictive ou récompense décorative attribuée à tort.
- Respect de « Réduire les animations » pour les barres, la notification et les panneaux natifs.
- La clé `vestige.journal.v1`, les données des monuments et les règles de récompense sont conservées.

## Parcours, Carnet, Défis et Profil

- Parcours : photographie réelle, étapes, distance à vol d’oiseau, marche estimée explicitement indicative, XP total/restant et progression.
- Carnet : collection réelle, filtres Vienne/Lyon et état vide avec accès à la carte.
- Défis : quatre succès permanents existants, sans ajout de récompenses arbitraires.
- Profil : avatar, niveau, barre XP, monuments/villes visités et badges dérivés du carnet.
- Quêtes quotidiennes et classements : signalés « À venir », sans rangs, joueurs, échéances ou activités fictifs.

Les huit photos ont été récupérées en meilleure définition depuis les mêmes fichiers Wikimedia Commons. Leurs auteurs, licences et liens restent ceux des fiches existantes. Les captures Lovable n’étant pas accessibles, aucune reproduction précise de leurs écrans n’est revendiquée.

## Compatibilité et validation

Expo SDK 58 conservé. Modules ajoutés pour la marque : `expo-linear-gradient ~58.0.3` et `expo-splash-screen ~58.0.13`, vérifiés avec le SDK 58. Pas de nouvelle permission ni de changement de moteur cartographique.

Tests disponibles : TypeScript, lint, 17 tests Node (règles GPS, progression, états de marqueurs, contraste) et exports Hermes iOS/Android. Ces vérifications ne remplacent pas un essai sur téléphone : bottom sheet, animations, grands caractères, capteurs et conservation de l’expérience Expo Go doivent être contrôlés sur l’iPhone.

Les icônes et le splash natifs personnalisés sont configurés ; une build native de production est nécessaire pour leur validation complète ; Expo Go ne permet pas de valider l’icône installée de VESTIGE sur l’écran d’accueil iOS.
