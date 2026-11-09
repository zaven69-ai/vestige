# Validation du prototype — 9 novembre 2026

- 34 tests réussis : 28 contrôles existants conservés + 6 contrôles liés au catalogue, à la préférence, au contrat de rendu et aux imports.
- TypeScript et ESLint sans erreur.
- Exports Hermes iOS et Android réussis (aucune publication).
- Blender 4.3.2 : création du squelette canonique de 17 os réussie.
- Chaîne GLB → Blender CPU → 90 poses RGBA + 1 portrait vérifiée sur un bloc riggé technique temporaire, hors des assets de l'application.
- PNG réels vérifiés : dimensions, RGBA 8 bits, intégrité CRC et décompression des pixels.
- Refus du pack non approuvé vérifié ; enregistrement de 91 références statiques vérifié dans un projet temporaire isolé. Aucun asset de test installé comme personnage.
- Les essais ont révélé et corrigé les noms d'actions suffixés par Blender, l'inclusion des formes d'affichage d'os dans les limites du modèle et l'absence d'OpenImageDenoise dans ce build. Le débruitage est optionnel.
- Registre réel Alex/Léa vide : aucune nouvelle apparence prétendument finale.
- Aucun changement des règles GPS/XP ou du schéma SQLite ; les tests de non-régression restent réussis.

Limites : aucun modèle humain Alex/Léa disponible pour revue artistique ; aucun appareil physique connecté. Les exports ne prouvent ni la fidélité à la référence ni les performances sur iPhone. À tester dans Expo Go : sélection sauvegardée, retour sur carte, reprise après redémarrage, pause des démonstrations en arrière-plan et fonctionnement GPS extérieur.
