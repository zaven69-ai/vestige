# Issue #7 — localisation simulée dans Explorer

Évolution audio : [George dans Explorer, issue #8](../live/GEORGE-EXPLORER-V1.md) ajoute une démonstration privée manuelle distincte des narrations approuvées.

## Livré

En développement (`__DEV__`, notamment Expo Go), Explorer propose le bouton Développeur et une entrée dans les options de carte. L'activation demande confirmation, place Catia au repère existant du centre de Vienne et affiche **MODE TEST — GPS SIMULÉ · aucun XP**. Le bandeau reste présent dans les autres onglets ; les fiches, options et outils modaux rappellent aussi le mode test.

Le joystick tactile marche dans toutes les directions, avec une vitesse maximale de 1,4 m/s et des positions mises à jour toutes les 250 ms. Sa direction suit l'orientation de la carte. La position est interpolée avec les mécanismes natifs existants ; les sprites Idle/Walk et l'apparence de Catia sont réutilisés. Aucun modèle, texture, sprite ou animation de personnage n'est remplacé. La caméra reste orientée au nord pendant le suivi simulé pour éviter une rotation en boucle avec le joystick. Le déplacement manuel de carte et le recentrage restent disponibles. Le joystick s'efface pendant la consultation d'une fiche pour laisser les contrôles lisibles.

L'appui long sur la carte propose une téléportation après confirmation, uniquement en mode test. Les outils proposent aussi des boutons explicites pour :

- Centre de Vienne : repère déjà présent dans `cities.Vienne`.
- Temple d'Auguste et de Livie : 45.525698, 4.874218.
- Jardin archéologique de Cybèle : 45.524969, 4.875451.
- Théâtre antique : 45.524787, 4.878314.

Les trois coordonnées de monuments proviennent des points d'approche existants de `src/data/live/vienneAntique.ts`, avec les mêmes références officielles. Il ne s'agit pas de nouvelles positions GPS mesurées ni d'entrées garanties.

Le guidage reste dans Explorer : routes piétonnes Valhalla réelles depuis le point simulé, distances, durée, instructions, recalcul, arrivée et fiches. Les étapes avancent dans une session de démonstration. « M'y rendre » dans une fiche utilise également Explorer et le même moteur, pour les deux sources de position. Parcours conserve son rôle de sélection, sans deuxième carte.

## Séparation des données

- `DeveloperLocationProvider` possède un contrôleur éphémère, sans stockage ni analytique. Son activation est impossible dans une instance de production. Aucun paramètre d'URL ou préférence sauvegardée ne l'active.
- `useExplorationLocation` fournit la seule position étiquetée (`device` ou `developer-preview`) à la carte et au guidage. `GameProvider.fix` demeure exclusivement le GPS natif.
- `GameProvider.discover` refuse toute récompense quand le contrôleur est activé, même si le GPS réel est proche du monument et même depuis un ancien callback. La garde est aussi vérifiée après l'attente d'ouverture de la base, avant l'écriture. XP, carnet et badges ne sont pas modifiés par une visite simulée.
- `LiveProvider` conserve son état réel et un état de démonstration séparé en mémoire. Les actions périmées du contexte réel sont bloquées en simulation. La démonstration ne charge ni n'écrit de session ou de préférence Live. Changer d'étape, terminer et déclencher un audio ne persiste aucune visite simulée.
- Chaque changement de source et chaque téléportation changent la clé de requête de guidage. Les réponses d'une ancienne source sont rejetées ; l'arrivée et l'écart sont réinitialisés.
- Le relâchement du joystick, le masquage des contrôles, la sortie d'Explorer et l'arrière-plan arrêtent le déplacement. Une reprise ne rattrape pas le temps passé en arrière-plan.
- « Revenir au GPS réel » efface les coordonnées et la session de démonstration, restaure la session réelle et redémarre la recherche GPS. Un refus de permission conserve une position indisponible ; aucune position simulée n'est présentée comme réelle.

Les autres actions explicitement demandées par l'utilisateur, comme préparer un brouillon de contribution privé ou un favori, conservent leur fonctionnement. Aucun événement de visite analytique n'existe ou n'est ajouté.

## Audio George

Le lecteur existant et ses critères éditoriaux sont réutilisés. Les modes manuel et automatique fonctionnent sur la session éphémère lorsque des audios approuvés sont disponibles. Le catalogue actuel contient trois scripts sourcés et **zéro enregistrement approuvé** : l'interface indique Audio en préparation et n'invente pas une voix George. Les protections éditoriales restent applicables en mode test.

## Essai iPhone avec Expo Go

1. Arrêter Metro, appliquer le script cumulatif Windows épinglé au commit de livraison, puis `npm.cmd install`. Ne pas désinstaller Expo Go ni effacer les données de l'application.
2. Démarrer `npx.cmd expo start --tunnel --clear --port 8088`. Avec SDK 58, le tunnel signé Expo demande une connexion (`npx.cmd expo login`). L'alternative sans connexion Expo est `npx.cmd expo start --tunnel ngrok --clear --port 8088` ; sa disponibilité dépend du réseau et du service ngrok. Sur le même Wi-Fi, utiliser `npx.cmd expo start --lan --clear --port 8088` si les tunnels échouent et autoriser Node sur le réseau privé Windows.
3. Scanner le nouveau QR code avec l'iPhone. Explorer → Développeur → Activer le mode test à Vienne → confirmer. Aucune permission GPS n'est nécessaire pour cet aperçu.
4. Vérifier le bandeau, Catia entière et les marqueurs dorés. Maintenir le joystick puis relâcher ; vérifier marche, orientation et retour Idle. Tester avec la carte tournée, puis en suivi/recentrage.
5. Développeur → Téléporter · Théâtre antique. Vérifier la position immédiate, le suivi et le recalcul. Tester aussi l'appui long, son annulation et sa confirmation.
6. Tester Vienne antique, puis Temple → Cybèle → Théâtre : trajet suivant les rues, changements de direction, fiche après arrivée confirmée, étape suivante sans quitter Explorer. Utiliser les téléportations pour accélérer l'essai ; l'approche au joystick reste possible. Une arrivée demande plusieurs relevés sur au moins trois secondes.
7. Lire une fiche → M'y rendre · trajet de test. Vérifier le trajet, puis le message de découverte désactivée. Constater que les XP/carnet et le vrai parcours ne progressent pas.
8. Ouvrir les outils ou une fiche pendant le déplacement, quitter l'onglet ou passer en arrière-plan : le mouvement doit s'arrêter.
9. Revenir au GPS réel, avec permission acceptée puis refusée. Le bandeau disparaît ; Catia attend le vrai GPS et la progression réelle précédente est restaurée. Relancer l'application : la simulation est désactivée par défaut.

Le service public de routage nécessite le réseau ; un échec n'est jamais remplacé par un trajet fictif. Les positions de démonstration sont transmises à Valhalla comme points de calcul clairement simulés.

## Vérifications de livraison

- 134 tests Node, dont 8 nouveaux sur les sources, la production, le joystick, les téléportations, le verrouillage des écritures, la clé de requête, l'arrivée et l'écart avec le moteur existant.
- `scripts/developer/check-simulation-browser.cjs` monte les vrais providers, hooks et contrôles React avec des substituts DOM pour React Native, stockage et GPS ; les réponses de routage proviennent des fixtures enregistrées. Le scénario vérifie gestes du joystick, téléportation, arrivée, chemin piéton, étape éphémère, rejet d'un ancien callback réel, conservation des écritures Live (5 avant / 5 après), XP inchangés, retour à la session réelle, découverte réelle après sortie et refus de permission. Il ne valide pas le rendu MapKit, les gestes natifs ni le débit d'images iPhone. Outil mainteneur nécessitant Playwright et Chromium, sans dépendance ajoutée à l'application.
- TypeScript, lint et catalogue audio passent ; `npm install`, TypeScript et les 134 tests passent aussi sur un dossier séparé mis à jour par le manifeste cumulatif.
- Le bundle Metro iOS de développement compile avec `__DEV__=true` et contient réellement le contrôleur, les outils de simulation, le guidage et Catia. Les exports iOS/Android production réussissent également.
- Les deux appels directs à Valhalla réussissent : Temple → Cybèle, 173 m / 129,245 s / 16 sommets ; Cybèle → Théâtre, 352 m / 295,983 s / 35 sommets. Ce sont des résultats du moteur au moment du contrôle, pas des durées mesurées de marche réelle.
- Le tunnel Cloud n'a pas pu être établi : tunnel signé Expo sans session connectée, puis échec de démarrage ngrok. Metro local répond et compile ; aucune connexion physique Expo Go iPhone n'est donc déclarée validée.

Validation physique sur iPhone : **à effectuer**. Aucun appareil iOS n'est connecté à l'environnement Cloud. Aucun nouveau SDK natif, service payant ou changement de version Expo n'est requis.
