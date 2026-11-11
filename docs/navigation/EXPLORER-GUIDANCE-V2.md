# Guidage dans Explorer — V2

## Architecture livrée

Parcours présente les parcours existants et appelle `LiveProvider.begin(tour.id)` avant de naviguer vers Explorer. Explorer héberge l'unique instance de guidage et sa grande carte. Les anciennes routes de visite redirigent vers Explorer. Le sélecteur de position de Contribuer garde sa carte indépendante : il ne fait pas de guidage.

`useExplorerGuidance` coordonne la session, le moteur piéton `useWalkingNavigation`, la visibilité des narrations et les étapes. L'itinéraire Valhalla réel est affiché avec deux polylignes bleu nuit/or. Le HUD montre l'étape, l'instruction, la distance et la durée restantes ; ses options donnent accès à la pause, au recalcul, au mode narration, aux outils de carte et à la sortie. Le geste sur la carte suspend le suivi ; le bouton de recentrage reprend le suivi de Catia.

Les étapes du parcours restent visibles individuellement avec les marqueurs illustrés existants, même si un filtre les exclurait. Les autres POI conservent leur regroupement existant. Aucun fichier de Catia ni aucun asset POI n'est modifié.

À l'approche confirmée, la fiche historique existante s'ouvre une seule fois par étape pendant cette session d'Explorer. Son pied de fiche permet de consulter la narration disponible et de passer à l'étape suivante. Une arrivée ou un clic suivant ne donne pas de XP : les protections du journal GPS restent indépendantes.

## Sauvegarde

Le cache `vestige.live.tour-checkpoints.v1` conserve une session par parcours et un identifiant de parcours actif. L'ancienne session Live est migrée sans toucher au carnet ni aux XP. Quitter détache le parcours actif sans perdre ses étapes ; Reprendre le restaure. Une sauvegarde illisible bloque l'écriture et reste conservée.

## GPS, audio et limites

Le moteur conserve les protections existantes : GPS récent/précis, arrivée confirmée par plusieurs fixes, recalcul après écart durable, annulation des requêtes obsolètes et suspension hors premier plan. Pas de tracé droit de substitution ni de distances inventées en cas d'échec. Le calcul utilise le service public Valhalla/FOSSGIS et nécessite du réseau ; au-delà de 50 km, utiliser Plans/Maps pour rejoindre le parcours. Ce service public n'offre pas de garantie de disponibilité.

Le contrat `NavigationPosition` distingue `device` de `developer-preview` pour le futur joystick. Aucune interface de simulation n'est activée. Une position d'aperçu ne permet ni guidage réel, ni arrivée, ni narration automatique ; elle n'est pas injectée dans le GameProvider.

Les scripts Vienne antique restent des brouillons sourcés. Aucun enregistrement approuvé n'est ajouté : l'interface affiche Audio en préparation. La lecture et le déclenchement automatique exigent toujours les validations éditoriales et un fichier audio enregistré/approuvé. Le mode automatique ne fabrique aucun son.

## Vérification iPhone nécessaire

1. Mettre à jour avec le script cumulatif Windows épinglé au commit de livraison ; conserver l'installation Expo Go et ses données.
2. Parcours → Vienne antique → Commencer : Explorer doit s'ouvrir, Catia rester visible et le trajet suivre les voies réelles.
3. Autoriser le GPS ; tester aussi un refus, une précision insuffisante et l'absence de réseau : aucune navigation fictive.
4. Déplacer/zoomer la carte puis recentrer ; vérifier la fluidité et les marqueurs dorés.
5. Sur place, suivre Temple → Cybèle → Théâtre : fiche à l'arrivée, étape suivante sans quitter Explorer, nouveau calcul réel.
6. S'écarter du chemin, vérifier le recalcul après plusieurs fixes ; passer l'app en arrière-plan puis revenir.
7. Quitter et Reprendre ; changer de parcours puis revenir ; vérifier carnet et XP inchangés.

Les tests automatisés et exports Metro ne remplacent pas cette validation physique sur iPhone.

## Résultats automatisés de cette livraison

- 126 tests Node passent, dont 8 nouveaux couvrant le démarrage réel du composant TourCard, le choix du parcours, la migration/reprise/sortie des sessions, l'ouverture unique des fiches d'arrivée, les étapes visibles sans doublons et la séparation des coordonnées d'aperçu.
- TypeScript, lint Expo et validation du catalogue audio passent : 3 scripts, 0 enregistrement approuvé.
- Contrôle de mise en page du composant HUD avec primitives natives simulées : aucun débordement horizontal aux largeurs 320, 390 et 430 pixels. L'artefact HTML est un contrôle de mise en page avec données de test, pas un rendu natif ni une preuve GPS.
- L'installation cumulative est vérifiée séparément sur un dossier de mise à jour : `npm install`, TypeScript et 126 tests passent. Les exports Metro/Hermes iOS et Android réussissent (environ 6,7 Mo par bundle). Cela vérifie l'assemblage, pas l'affichage natif ni un trajet physique.
- Le moteur de routage et ses tests de géométrie/arrivée/écart sont conservés. Aucun nouveau service natif ni dépendance n'est ajouté.

Validation physique iPhone : en attente, aucun téléphone n'est connecté à cet environnement.
