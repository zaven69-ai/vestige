# VESTIGE V2 — tranche A / B à valider sur iPhone

Cette branche continue le projet complet de la PR nº 1 (`codex/transfer-vestige`). Au début du travail, la PR nº 1 était encore ouverte et `main` ne contenait qu’un README. La V2 ne doit donc pas être construite depuis ce `main` incomplet.

## Phase A — implémentée, validation visuelle sur téléphone requise

- Carte native occupant tout l’écran, derrière une navigation flottante compacte respectant les zones de sécurité.
- Aucune fiche sélectionnée par défaut. Les grands bandeaux permanents, le sélecteur de ville et la liste de boutons ont disparu de la carte.
- Profil compact : avatar, niveau, barre XP, nombre de découvertes, lien vers Profil.
- Paramètres et filtres historiques via deux petites commandes ; le choix de ville est dans les paramètres.
- Petits marqueurs par période, validation visuelle des lieux déjà découverts, sélection et aperçu compact refermable. L’ouverture de la fiche historique existante reste opérationnelle.
- Perspective native à 45° activée par défaut, désactivable dans les paramètres. Apple Plans utilise une altitude en mètres ; Google Maps utilise un zoom. Le rendu et le relief dépendent du moteur et de ses données. Il ne s’agit pas d’un nouveau moteur 3D.
- Suivi caméra sur GPS récent et précis à 50 m ou mieux. Glisser, pincer ou faire pivoter la carte suspend le suivi. Le bouton de localisation réactive le suivi et recentre avec une transition native. La boussole remet le nord en haut, sans empêcher les rotations manuelles.
- Si le GPS est refusé, imprécis ou périmé : la carte, les villes, les filtres et les fiches restent accessibles. Les réglages affichent l’état détaillé.

## Phase B — implémentée, validation capteurs/rendu sur téléphone requise

- Explorateur 2D original dessiné avec des composants React Native : chapeau, veste, sac, foulard et petite boussole. Aucun asset Pokémon utilisé.
- Architecture séparée : `ExplorerAvatar` dessine le personnage et reçoit une palette `AvatarAppearance` ; `PlayerMarker` s’occupe du placement et du déplacement sur la carte. Une personnalisation ou un autre moteur de personnage pourra remplacer la présentation.
- Position obtenue uniquement depuis les relevés réels d’expo-location ; aucun mode démonstration ni boucle de marche artificielle.
- Petites dérives GPS filtrées visuellement. Les déplacements sont interpolés pendant 650 ms sur de nouveaux relevés suffisamment précis. Un grand saut ou un relevé imprécis est replacé directement. L’option système « Réduire les animations » est respectée.
- Direction d’après le nord vrai du capteur, uniquement avec une calibration moyenne ou bonne ; repli possible sur un cap GPS si vitesse ≥ 0,8 m/s et précision ≤ 25 m. Sur Apple Plans, le dessin tourne relativement au cap de la caméra ; Android utilise la rotation native du marqueur. Sans cap fiable, aucun indicateur directionnel n’est affiché. Il n’y a pas d’animation de marche à l’arrêt.
- Cercle discret de proximité à 100 m et zone d’incertitude GPS quand celle-ci est lisible. Ces cercles n’accordent aucune découverte automatiquement.
- Les capteurs de direction sont limités à l’onglet Explorer actif. Aucun accès en arrière-plan. Le GPS reste au premier plan ; l’intervalle demandé sur Android passe de 3 à 5 secondes. Sur iOS, la fréquence dépend du système (le réglage timeInterval est spécifique à Android).

Les distances et les validations de découverte continuent à utiliser les coordonnées GPS brutes, jamais les positions interpolées de l’avatar. La clé `vestige.journal.v1`, le contenu du carnet, les règles de récompense et les identifiants des huit monuments sont conservés. Aucun effacement ni migration de progression.

## Phases suivantes — après validation A / B

- **C** : bottom sheet de monument avec états réduit/développé, chronologie, anecdotes sourcées, mise en évidence animée des monuments à portée. Pour cette tranche, l’aperçu compact ouvre toujours la fiche existante.
- **D** : animation de découverte, XP animé, notification de montée de niveau, nouveaux badges/récapitulatif. Les XP, niveaux et défis existants restent fonctionnels, mais leurs nouvelles animations ne sont pas livrées ici.
- **E** : mesures de fluidité/batterie sur appareils réels, tests d’accessibilité et réglages après retour terrain. Le lint, les tests et les exports natifs sont réalisés dans le Cloud ; ils ne remplacent pas ces essais.

## Fichiers concernés

- `src/app/(tabs)/index.tsx` : exploration et suivi caméra.
- `src/app/(tabs)/_layout.tsx`, `src/components/ui.tsx` : navigation flottante et dégagement des contenus.
- `src/components/exploration/ExplorerAvatar.tsx`, `PlayerMarker.tsx` : avatar et animation GPS.
- `src/components/exploration/HistoricalMarker.tsx`, `ExplorerHUD.tsx`, `MapOptions.tsx` : marqueurs et commandes.
- `src/hooks/useExplorerSensors.ts`, `src/lib/exploration.ts` : direction, accessibilité et règles d’affichage.
- `src/lib/game.ts`, `src/lib/store.tsx` : cap/vitesse optionnels dans les relevés, intervalle Android. Persistance et récompenses conservées.
- `tests/exploration.test.ts`, `package.json`, `tsconfig.json` : tests GPS/cap supplémentaires et exécution de toutes les suites.
- `README.md`, ce document : usage, limites et validation.

Aucune nouvelle dépendance. `app.json`, `package-lock.json`, les fiches, les photographies et les écrans Carnet, Défis et Parcours sont conservés.

## Récupération sous Windows

### Si le projet local utilise Git

Sauvegardez/committez d’abord d’éventuelles modifications locales. Depuis le dossier du projet :

```bat
git fetch origin
git switch --track -c codex/v2-immersive-explorer origin/codex/v2-immersive-explorer
npm ci
npx expo start --clear
```

Si la branche existe déjà localement : `git switch codex/v2-immersive-explorer`, puis `git pull --ff-only`.

### Si le projet a été téléchargé en ZIP

1. Téléchargez : https://github.com/zaven69-ai/vestige/archive/refs/heads/codex/v2-immersive-explorer.zip
2. Arrêtez Metro avec Ctrl+C et faites une copie de sauvegarde de votre dossier VESTIGE Windows.
3. Extrayez le ZIP dans un dossier temporaire. Copiez son contenu dans votre dossier VESTIGE existant, en acceptant le remplacement des fichiers correspondants. Ne supprimez pas votre dossier actuel, ne désinstallez pas Expo Go et n’effacez pas ses données.
4. Depuis ce même dossier de projet : `npm ci`, puis `npx expo start --clear`. Cette commande vide le cache Metro, pas le carnet local.
5. Scannez le QR code avec le même iPhone/Expo Go compatible SDK 58. Utilisez le même projet et, si possible, la même adresse réseau/port. La persistance Expo Go dépend de l’espace de stockage de l’expérience ; l’absence de migration dans le code ne garantit pas une conservation si Expo Go ouvre une expérience différente.

## Protocole de validation iPhone

1. **Avant mise à jour** : noter le nombre de découvertes, les XP et le niveau ; vérifier leur conservation après mise à jour/rechargement. Ne pas réinitialiser les données.
2. **Sans GPS** : carte accessible, aucun faux avatar. Ouvrir les paramètres, Vienne/Lyon, filtres et fiches. Vérifier que les gestes passent à travers les zones libres de l’interface.
3. **GPS précis** : vérifier la position avec Plans. Marcher 20–30 m, vérifier le suivi, le déplacement mesuré de l’avatar et le recalcul de distance après sélection d’un monument.
4. **Gestes** : glisser, pincer, pivoter ; le suivi doit passer en exploration libre et ne pas ramener la caméra de force. Toucher le recentrage pour réactiver le suivi ; toucher la boussole pour remettre le nord en haut.
5. **Perspective** : basculer 45°/vue à plat. Noter le résultat réel Apple Plans (ne pas attendre un modèle 3D pour chaque bâtiment).
6. **Avatar/cap** : rester immobile, vérifier l’absence de marche artificielle. Faire tourner le téléphone dehors ; l’indicateur n’apparaît que si le cap est fiable. Vérifier un environnement avec capteurs perturbés : aucune direction fictive.
7. **GPS faible/refusé** : précision dégradée ou permission retirée ; consulter l’état dans les paramètres. Les découvertes doivent rester bloquées si les conditions ne sont pas réunies. Réactiver puis actualiser le GPS.
8. **Régression découverte** : depuis la fiche, valider un monument à portée ; vérifier les XP, le carnet et le marqueur vert validé. Aucune seconde récompense pour ce monument.
9. **Navigation** : parcourir les cinq onglets et vérifier que le bas des pages reste lisible au-dessus de la navigation. Tester les grands caractères, Réduire les animations et l’aller-retour en arrière-plan.
10. **Batterie/performance** : marche 10 minutes, rotation/zoom, retour depuis une autre app ; noter la fluidité et l’autonomie. Les capteurs de direction doivent être arrêtés hors Explorer et en arrière-plan.

Aucun appareil physique n’était connecté au Cloud pendant ce développement. Les tests capteurs, les gestes et les captures d’écran natives restent à effectuer sur l’iPhone avant validation des phases A/B.
