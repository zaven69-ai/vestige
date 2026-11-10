# Contrôles de Catia

- 38 tests de code/intégrité réussis : logique GPS/XP/carnet existante, avatars, original Catia inchangé, texture source identique, trois budgets géométriques, vrais clips binaires, poids normalisés et activation bloquée.
- TypeScript et ESLint sans erreur.
- Exports Hermes iOS et Android réussis, sans publication ni nouvelle dépendance native.
- Rig expérimental : 17 os, 16 122 sommets pondérés, au plus 4 influences.
- Animations réellement variables : Idle, Walk, Run. Pas de clips seulement nommés ou simulés.
- Qualité de déformation : Idle passe les contrôles élémentaires échantillonnés ; Walk et Run échouent au seuil d'étirement. Le personnage n'est pas validé pour la production ou la carte.
- Texture JPEG 2048×2048 conservée à l'identique dans les GLB statiques ; vues avant/après examinées.
- Original préservé par empreinte SHA-256 ; copies normalisées à 1,75 m, glTF +Y haut / +Z avant.
- Aucun essai physique iPhone ou Android. Les images de contrôle Blender ne sont pas des captures de téléphone.

Le succès des tests de code ne transforme pas les mouvements expérimentaux en animations approuvées. Les flags de validation manuelle et de tests appareil restent faux ; Catia n'est pas sélectionnable comme avatar de carte.
