# POI V2.4 — priorité aux monuments individuels sur iPhone

La capture iPhone après V2.3 montre les compteurs mais aucun PNG individuel. La validation précédente était insuffisante : le test du catalogue de Vienne ne chargeait pas les 791 enregistrements OSM et les tests Node ne validaient pas le rendu natif des PNG.

## Corrections

- `viewportGroups` renvoie chaque POI visible individuellement à latitudeDelta <= 0,03 (vue ville/rue), sans exception pour les coordonnées identiques. Les regroupements spatiaux restent réservés aux vues plus éloignées. Aucun POI n'est supprimé.
- Le réglage « POI individuels » désactive les compteurs à toutes les distances. Il est activé par défaut dans cette livraison pour rendre immédiatement chaque lieu accessible. En le désactivant, le mode automatique regroupe uniquement les vues éloignées ; les vues ville/rue restent individuelles. Ce choix est valable pour la session et n'écrit pas dans les données de progression.
- En touchant un marqueur individuel, `coincidentPois` propose la liste de tous les lieux situés à moins de 3 m s'il y en a plusieurs. La sélection dans cette liste ouvre directement la fiche : elle ne repasse pas par la recherche des voisins.
- `IllustratedPoiMarker` rend sur iOS une seule `Image` React Native, en 64 × 72 points, avec le PNG préassemblé correspondant à sa catégorie, son statut et sa découverte. Le suivi du marqueur commence actif et ne s'arrête qu'après `Image.onLoad` et un rafraîchissement différé de 150 ms. Les changements de source réactivent ce suivi. Android conserve `Marker.image`. Les marqueurs restent explicitement cliquables et l'image ne capte pas les événements tactiles.
- Le toucher du fond de carte ignore `marker-press`, afin de ne pas effacer une sélection par remontée d'événement.

## Constat technique iOS

Dans react-native-maps 1.29.11 installé, `ios/AirMaps/RNMapsMarkerView.mm` transmet `image.uri` à `AIRMapMarker.setImageSrc`. Ce dernier charge l'image via `[RCTBridge currentBridge] moduleForName:@"ImageLoader"` dans `AIRMapMarker.m`. C'est un risque de compatibilité avec le runtime Fabric sans pont d'Expo/RN récents. L'état effectif de ce pont dans l'Expo Go du téléphone n'a pas été observé ; il ne s'agit donc pas d'une cause native confirmée sur appareil. Le nouveau chemin iOS utilise le composant Image de React Native, sans ce chargeur du marqueur.

## Validation

Les tests couvrent les deux chemins iOS/Android du composant réel, les sources PNG et le clic vers le bon monument, avec composants natifs simulés. Ils vérifient que le chemin iOS ne fige pas le marqueur avant le chargement. Ils ne prouvent pas le rendu UIKit.

Les tests de régression chargent aussi les trois sources JSON, dont les 791 imports, et vérifient qu'en vue ville/rue chaque enregistrement visible reste individuel. Le mode individuel est testé avec plus de 500 lieux visibles à distance. Les coordonnées superposées gardent toutes leurs identités dans la liste.

La validation physique sur iPhone reste requise : affichage, clic ouvrant la fiche, zoom, liste des lieux superposés et fluidité. Repère de version : « V2.4 · POI individuels » dans les réglages de la carte. Activer « POI individuels » doit afficher zéro regroupement dans le compteur de cette même rubrique.

Catia, ses assets/animations, le GPS, les XP, les fiches et le stockage des contributions ne sont pas modifiés.

## Résultats de livraison

- 82 tests automatisés réussis, TypeScript et ESLint réussis.
- Application du manifeste cumulatif à la copie de test de l'ancien projet, `npm install` avec dépendances préalablement téléchargées, TypeScript et 82 tests : réussis.
- Exports Hermes iOS et Android de cette copie mise à jour : réussis.
- Aucun fichier de données POI, de GPS ou d'avatar modifié.
- Script PowerShell non exécuté sous Windows ; rendu natif et performances sur iPhone physique non validés.
