# POI V2.3 — regroupement progressif

## Correction

L'ancienne grille de 64 points regroupait les marqueurs à tous les niveaux de zoom, même lorsque des lieux proches pouvaient être affichés individuellement. Elle incluait aussi une zone deux fois plus large/haute que la vue. Les trois petits contours décoratifs du compteur pouvaient être perçus comme « 0 0 0 » : ils sont retirés. Le compteur affiche seulement le nombre réel et « lieux ».

`src/lib/mapViewport.ts` utilise maintenant une recherche de proximité par grille spatiale et ancres stables. Les distances sont calculées en points d'écran aux vues éloignées/intermédiaires, avec un rayon de 32 puis 18 points. Le regroupement suit donc la densité réelle, sans imposer le partage d'une case arbitraire. La zone de travail est la vue avec une marge de 20 % sur chaque dimension.

Lorsque latitudeDelta descend à 0,003 degré (environ 334 m nord-sud), les POI deviennent individuels, sauf ceux pratiquement superposés à moins de 3 m de leur ancre. La limite de 96 marqueurs s'applique uniquement aux vues éloignées (latitudeDelta >= 0,01), par élargissement du rayon. Aucun POI visible n'est supprimé : chaque identité reste représentée par un marqueur ou un groupe. Les données originales restent intactes hors écran.

Le toucher d'un groupe cadre ses membres réels avec marge, au lieu de diviser aveuglément le zoom par deux. Si tous les membres sont pratiquement superposés (à 6 m de la première position au maximum), le sélecteur existant affiche leurs fiches disponibles. Les POI individuels continuent d'utiliser `IllustratedPoiMarker` et ses PNG natifs dorés, sans modification de provenance ni d'état de découverte.

Version visible dans les réglages : « V2.3 · zoom progressif ».

## Contrôles

Huit nouveaux tests couvrent les niveaux de zoom, la densité faible, les coordonnées superposées, le cadrage, la conservation de 900 identités, l'ordre déterministe et le branchement réel des marqueurs et le catalogue réel de Vienne. Les tests antérieurs conservent leur couverture des 791 imports, des assets, des XP et de Catia.

Le rendu et la fluidité sur iPhone physique restent à vérifier après installation. Les tests de calcul et les exports ne constituent pas une validation du pont natif Expo Go.

Catia, ses modèles et ses animations, le GPS, le stockage de progression, les fiches et les contributions ne sont pas modifiés.

## Résultats de livraison

- TypeScript, ESLint et 78 tests : réussis.
- Paquet cumulatif appliqué à la copie de test de l'ancien projet : `npm install`, TypeScript et 78 tests réussis ; les dépendances téléchargées précédemment ont été réutilisées.
- Exports Hermes iOS et Android : réussis.
- À centre fixe (45,525 ; 4,875), catalogue embarqué : 15 marqueurs individuels et 3 groupes à latitudeDelta 0,025 ; 13 individuels et aucun groupe à 0,01. Ces effectifs sont ceux de la zone visible de ce catalogue, pas un comptage des téléchargements OSM du téléphone.
- Aucun fichier Catia, source GPS ou donnée de monument modifié.
- Tests iPhone physique et exécution du script PowerShell sous Windows : à faire ; environnement de développement Linux.
