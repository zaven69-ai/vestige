# Catia sur la carte — version 1

## Choix technique

La carte utilise une représentation 2,5D : 208 PNG transparents rendus par Blender depuis le véritable modèle corrigé `assets/avatars/catia/rig-lab/revision-2/catia-corrected.glb`. Aucun nouveau personnage ni retouche de mesh, de visage, de coiffure, de texture ou de tenue. Les fichiers Blender et GLB restent inchangés.

Le GLB est audité par les tests existants : 24 996 triangles, 17 os, animations Idle, Walk, Run. Les clips et leur rig restent expérimentaux : en particulier les mains restent près des poches pendant la course. Cette livraison n'améliore pas les déformations et ne prétend pas valider la 3D temps réel sur iPhone.

Un moteur 3D dans un marqueur natif demanderait une intégration GL/synchronisation de caméra supplémentaire, avec un coût de capture/rafraîchissement sur la carte. Le choix des sprites autorisé par la demande évite ce coût. Le visualiseur 3D existant reste disponible, et aucun Canvas/GLView n'est monté sur la carte.

## Ressources et affichage

- `scripts/avatars/catia/render_map_sprites.py` : rendu local Cycles, 32 échantillons, transparence, sans API payante. Ne sauvegarde ni ne modifie le modèle.
- `assets/avatars/catia/map-sprites/` : 8 directions × (6 Idle + 12 Walk + 8 Run), soit 208 PNG de 192 × 272 pixels. Rapport de source, d'échantillonnage et SHA256 dans `render-report.json`.
- `src/components/exploration/avatar/catiaSprites.ts` : imports statiques pour Metro.
- `PlayerMarker.tsx`, `CatiaSprite.tsx`, `useCatiaFrame.ts` : corps entier affiché en 96 × 136 points, halo et ombre aux pieds, position native liée au GPS existant. Huit orientations relatives à la direction réelle et à la rotation de la carte. Direction inconnue : face, sans prétendre connaître le cap.
- Idle dure 3 s, Walk 1,2 s, Run 0,8 s. Fréquence maximale des images : 10 Hz pour un seul joueur. Arrêt des horloges en arrière-plan, hors écran, dans les panneaux, en pause ou en réduction des animations.
- `src/lib/avatars/catiaMap.ts` : distinction marche/course à partir des contrôles GPS existants. Course à partir de 2,2 m/s si le déplacement est plausible et les positions suffisamment précises. Un saut GPS ou un déplacement incertain n'active pas une fausse marche.

## GPS, aperçu et contrôles

Catia est choisie par défaut pour ce nouveau mode carte. La préférence indépendante `vestige.map.player.v1` permet de retrouver l'ancien avatar, sans écraser la préférence Alex/Léa/legacy ni les XP et découvertes.

Avec un GPS récent, Catia est ancrée à la position réelle du joueur. Sans GPS récent/autorisé, `CatiaMapPreview` affiche un aperçu en surimpression à l'écran : « Catia · aperçu sans position GPS ». Il ne reçoit aucune coordonnée fictive, ne modifie aucun fix et ne peut attribuer ni découverte ni XP.

Réglages de carte → Personnage de la carte : Jouer avec Catia, Animations de Catia, Aperçu sans déplacement GPS. L'aperçu donne Repos/Marche/Course, Tourner par 45° et Pause. Avec GPS, le mode aperçu masque temporairement le marqueur joueur pour ne pas montrer deux Catia ; le GPS et ses calculs continuent à fonctionner. Désactiver l'aperçu restaure le personnage à la position réelle.

Le statut historique `mapEnabled: false` de l'audit GLB reste intact : il concerne l'ancienne étape de validation 3D. L'activation explicite de cette livraison porte sur le nouveau rendu par sprites et ne transforme pas les drapeaux de validation appareil en succès fictifs.

## Validation et limites

Les marqueurs POI dorés, leur regroupement, les fiches et les écritures de progression/contributions ne changent pas. Les ajouts dans Explorer et ses réglages concernent exclusivement le personnage et son aperçu.

Les 208 alpha-bounds ont été vérifiés : corps complet dans le canevas, bord transparent sur tous les côtés ; union des pixels visibles (50,28)–(142,251). Contrôles visuels de face, dos, profil et des mouvements. La planche `map-sprites-preview.html` montre les fichiers livrés, pas une capture de l'application.

Le rendu et la fluidité UIKit/Expo Go sur un iPhone physique doivent encore être testés. Les captures de navigateur et les tests React simulant les composants natifs ne remplacent pas cette validation. Les silhouettes sont orientées par pas de 45°, les mouvements sont échantillonnés et les PNG ne s'adaptent pas continuellement à l'inclinaison de la caméra. Une vraie 3D sur carte reste une étape ultérieure.

### Résultats de livraison

- TypeScript, ESLint et 88 tests : réussis. Les tests précédents d'intégrité GLB/Blender, de GPS et de progression restent actifs.
- Mise à jour cumulative appliquée à la copie de test de l'ancien projet : `npm install` (dépendances déjà téléchargées), TypeScript et 88 tests réussis.
- Exports Hermes iOS et Android de cette copie mise à jour : réussis ; les 208 sprites sont présents dans les assets exportés, vérifiés par SHA256.
- Planche de contrôle aux largeurs 320, 390 et 430 pixels : huit directions et trois clips chargés sans erreur JavaScript ni débordement horizontal ; inspection visuelle réalisée.
- Pas de changement aux fichiers de rendu/données/règles POI ni aux modèles GLB/Blender. Explorer et ses réglages reçoivent uniquement les ajouts du personnage.
- Rendu natif et fluidité sur iPhone physique, ainsi qu'exécution du script sous Windows : à confirmer chez l'utilisateur. Aucun drapeau `iosDeviceTested` n'est passé à vrai.
