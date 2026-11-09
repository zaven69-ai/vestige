# Vérifications V3

- 28 tests Node réussis, dont migration SQLite, rollback en cas de corruption, absence de double récompense et persistance après fermeture/réouverture du fichier réel.
- TypeScript : aucune erreur.
- ESLint Expo : aucune erreur ni avertissement.
- `expo install --check` : dépendances compatibles avec le SDK du projet.
- Export Hermes iOS et Android réussi ; pas de publication OTA ou de build EAS.
- Logo original et sprites contrôlés par les tests existants.
- Aperçu cartographique généré : `atlas-preview.png`, contrôlé visuellement. Ce n'est pas une capture d'écran iPhone.
- 35 identifiants uniques (8 initiaux + 27 nouveaux), 25 nouvelles photos avec attribution/licence, provenance des coordonnées conservée.

À faire sur appareil : LocalTile/MapKit et Android réel, préparation du cache, fluidité des gestes, GPS extérieur, migration depuis la même installation Expo Go, mode avion après préparation. Aucun benchmark physique n'est revendiqué.
