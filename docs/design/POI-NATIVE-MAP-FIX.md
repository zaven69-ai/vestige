# POI V2.2 — intégration native sur la carte

La carte Explorer monte désormais `IllustratedPoiMarker`, qui fournit directement un PNG local à `react-native-maps` avec `Marker.image`. L'ancien assemblage de plusieurs images dans une vue enfant capturée par le marqueur est supprimé du chemin actif. `HistoricalMarker` réexporte le même composant pour les anciens imports.

Les sept illustrations transparentes originales restent intactes dans `assets/poi/illustrated`. Le générateur `scripts/poi/build-native-map.cjs` assemble ces illustrations et leurs badges en 210 familles (7 catégories × 6 origines/statuts × 5 états), chacune déclinée en 1x, 2x et 3x : 630 PNG dans `assets/poi/map-native`. Taille logique : 64 × 72 points. Les imports sont statiques dans `src/components/poi/nativeMapAssets.ts` pour Metro.

Les statuts de contenu restent indépendants de la découverte. Un lieu importé ne devient jamais vérifié parce qu'il est découvert. Le badge XP apparaît uniquement pour un lieu réellement découvert. La sélection et la proximité utilisent un accent statique, sans animation continue ni rafraîchissement permanent des vues natives.

Les groupes conservent leur véritable effectif, le comportement de zoom et les coordonnées existantes. Leur cercle mesure maintenant 60 points et porte la mention « lieux ». La grille passe de 52 à 64 points pour limiter les chevauchements. Les réglages affichent « V2.2 · images natives » et les nombres de groupes/lieux individuels actuellement visibles.

## Livraison Windows

`update-social-v2.ps1` reçoit la mise à jour cumulative avec huit téléchargements simultanés, vérifie les SHA256 avant copie, sauvegarde les fichiers remplacés et contrôle les copies. Les éventuelles anciennes variantes JS/iOS/native des composants concernés sont déplacées dans la sauvegarde lorsqu'elles ne font pas partie de la livraison : elles ne peuvent plus prendre priorité sur le TSX actuel. Aucune présence de ces variantes chez l'utilisateur n'est présumée.

Relancer Metro sur le port 8088, fermer l'ancienne expérience Expo Go puis scanner le nouveau QR code. Le script ne touche pas aux données persistées sur le téléphone. Catia, le suivi GPS, les XP et le stockage des contributions ne sont pas modifiés par ce correctif.

## Vérifications et limites

Les tests vérifient les 630 dimensions PNG, les correspondances statut/découverte, le montage du composant par Explorer et la propriété `image` réellement produite par ce composant (pont natif simulé). TypeScript et ESLint sont contrôlés. La planche `poi-native-preview.html` utilise les fichiers réellement livrés ; ce n'est pas une capture iPhone.

La cause exacte du rendu observé sur le téléphone ne peut pas être prouvée à distance : ancienne installation, variante de module et capture de vues sont des pistes, pas des diagnostics confirmés. Le correctif change le chemin de rendu effectif et rend la version identifiable. Le rendu Apple Maps/Expo Go, les changements de badges après découverte et la fluidité restent à valider physiquement sur iPhone. Aucun test de navigateur ne remplace cette validation.

### Résultats de cette livraison

- TypeScript et ESLint : réussis.
- 70 tests automatisés : réussis.
- Application du manifeste cumulatif sur une extraction du commit pré-POI `2916df9`, puis `npm install`, TypeScript et 70 tests : réussis. Les dépendances déjà téléchargées ont été réutilisées dans cette copie de test.
- Exports Hermes iOS et Android de cette copie mise à jour : réussis. Les 630 PNG natifs sont présents dans les assets exportés, contrôlés par SHA256.
- Planche des fichiers livrés : 18 images chargées sans erreur JavaScript ni débordement horizontal aux largeurs 320, 390 et 430 pixels. Inspection visuelle effectuée ; ce contrôle ne teste pas le pont natif.
- Le script PowerShell n'a pas été exécuté sous Windows dans cet environnement Linux.
- Rendu et performances sur iPhone physique : en attente du test utilisateur, sans validation annoncée.
