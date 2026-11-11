# Issue #10 — Lyon, ville vitrine

## Périmètre livré

Lyon est le cadrage initial d'Explorer et la ville d'activation du GPS simulé. La carte conserve la dernière ville explicitement choisie dans les options (`vestige.map.city.v1`), sans toucher aux anciennes préférences d'avatar, au carnet ou aux XP. Un GPS réel valide garde la priorité sur la caméra et la position de Catia : aucun relevé de Lyon n'est injecté dans GameProvider. Le parcours Lyon existant est présenté en tête de Parcours ; Vienne et ses sessions restent accessibles. Une nouvelle session de démonstration sans parcours réel actif choisit Lyon, sans remplacer une visite réelle existante.

Les deux miniatures prioritaires de l'issue sont terminées :

- `fourviere` : basilique, quatre tours octogonales, galerie de façade, nef et toiture verte. Les sculptures et détails sont simplifiés ; la chapelle voisine à la Vierge dorée n'est pas inventée dans le bâtiment de la basilique.
- `theatre-lyon` : grand théâtre et petit odéon voisins, cavea ouverte, gradins inférieurs et maçonneries supérieures fragmentées, orchestra et fondations basses. Aucune toiture ni scène antique monumentale n'est restituée.

Saint-Jean (`saint-jean`) et la fontaine Bartholdi (`osm-way-55071957`) restent des POI existants à marqueurs dorés. **Leurs modèles ne sont pas livrés** : conformément à la priorité de l'issue, aucun modèle approximatif ou placeholder n'est ajouté. Le temple de Vienne et ses huit vues restent inchangés.

## Assets, références et droits

Le système de l'issue #9 est réutilisé : 8 angles par monument, PNG transparents 128/256/384 px, image d'aperçu, sources Blender et GLB hors exécution. La carte utilise les bitmaps 2.5D, pas des meshes interactifs géo-ancrés dans MapKit. Les tailles d'icônes et les proportions de la maquette ne sont pas une emprise cadastrale ou un relevé métrique.

Les rendus et géométries sont originaux pour Vestige, sous MIT ; aucune texture ou maille externe n'est incorporée, aucune génération payante n'est utilisée. Le socle circulaire bleu nuit/or est un décor d'interface. Le gazon est une évocation de l'aménagement actuel, pas une reconstitution antique.

Références :

- [Basilique Notre-Dame de Fourvière](https://fr.wikipedia.org/wiki/Basilique_Notre-Dame_de_Fourvi%C3%A8re), photographie déjà attribuée dans le catalogue : Sergey Ashmarin, CC BY-SA 3.0, [Commons](https://commons.wikimedia.org/wiki/File:Church_of_Notre_Dame_de_Fourviere_-_Lyon%2C_France_-_panoramio.jpg).
- [Théâtre antique de Lyon](https://fr.wikipedia.org/wiki/Th%C3%A9%C3%A2tre_antique_de_Lyon), photographie déjà attribuée : Jean-Christophe BENOIST, CC BY 4.0, [Commons](https://commons.wikimedia.org/wiki/File:Lyon_-_Lugdunum_-_Th%C3%A9atre_Romain.jpg).
- [Rue Mercière à Lyon](https://fr.wikipedia.org/wiki/Rue_Merci%C3%A8re_(Lyon)), point de rue 45.762486, 4.832794. La référence George est corrigée vers la page lyonnaise plutôt que la page d'homonymie ; cela n'approuve pas le script audio.

Ces références guident les silhouettes de l'état actuel, sans certification historique. Les coordonnées et identifiants des monuments restent ceux du catalogue : Fourvière 45.762391, 4.822415 ; théâtre 45.759722, 4.819722 ; Saint-Jean 45.7607, 4.8273 ; fontaine 45.7676311, 4.8334608. Aucun doublon n'est ajouté.

## Démonstration

Le menu développeur propose Centre de Lyon, Fourvière, théâtres, Vieux Lyon/Saint-Jean, Terreaux/fontaine et rue Mercière. Les points de Vienne restent dans la même liste. Les boutons de téléportation ne sont disponibles qu'après activation explicite du mode simulé ; son bandeau reste visible. Les routes « M'y rendre » utilisent le même moteur piéton et les mêmes protections, et les visites simulées ne donnent aucun XP ni progression réelle.

George reste le prototype privé manuel de l'issue #8 : texte fourni, non approuvé éditorialement, aucun déclenchement automatique en production. L'import MP3 privé local existant reste conservé par la mise à jour. Catia et les moteurs GPS, guidage, regroupement et audio ne sont pas remplacés.

## Reproduction et tests

```bash
blender -b --python-exit-code 1 --threads 2 --python scripts/monuments/build-lyon.py
```

Le script réutilise les helpers du temple et produit les deux packs. Les sources sont stockées dans `assets/monuments/miniatures/fourviere/` et `assets/monuments/miniatures/theatre-lyon/`. Les détails non modélisés ne sont pas des informations historiques déduites.

Tests : intégrité/transparence des 48 PNG lyonnais, modèles GLB, coordonnées et réutilisation des objets POI, séparation caméra/GPS, maintien de Vienne ; scénarios existants du joystick et de George. Le harnais du marqueur s'utilise avec `VESTIGE_MINIATURE_POI=fourviere` ou `theatre-lyon`, puis sans variable pour contrôler Vienne. Les substituts DOM vérifient React et les chargements, **pas le rendu natif MapKit ni 60 fps sur téléphone**.

## Installation et essai iPhone

Mettre à jour par le script cumulatif Windows épinglé au commit de livraison, puis `npm.cmd install` et `npx.cmd expo start --tunnel --clear --port 8088`. Conserver Expo Go, ses données et les variantes privées de George. Le tunnel signé peut demander `npx.cmd expo login` ; ngrok/LAN restent des alternatives.

1. Sans GPS réel, vérifier le cadrage sur Lyon (ou la ville précédemment choisie). Autoriser le GPS : Catia doit rejoindre uniquement le relevé natif, où que soit l'utilisateur.
2. Développeur → Activer le mode test à Lyon. Téléporter à Fourvière, zoomer, tourner et toucher la miniature : la fiche `fourviere` s'ouvre. Refaire pour les théâtres (`theatre-lyon`).
3. Utiliser « M'y rendre » entre les deux sites : route piétonne, indications et arrivée dans Explorer. Ne pas déduire une validation physique de ce test simulé.
4. Tester Saint-Jean, Terreaux et rue Mercière. Lire George, mettre en pause/reprendre, bouger Catia pendant la lecture ; aucun XP ni étape réelle ne doit changer.
5. Tester le parcours Lyon existant puis revenir à Vienne : temple, parcours antique et narrations en préparation conservés.
6. Réduire les animations, tester ville dense, zoom/rotation, erreur d'image et désactivation des miniatures. Vérifier la fluidité sur iPhone.
7. Revenir au GPS réel, tester permission refusée et redémarrage : la simulation doit rester éphémère et le carnet intact.

Validation physique Expo Go iPhone et mesure de performance native : **en attente**, aucun téléphone n'est connecté au Cloud. Aucune nouvelle dépendance native n'est ajoutée.

### Vérifications de livraison

- 146 tests Node passent, ainsi que TypeScript et lint sans cache/Expo.
- Fourvière, théâtres et temple de Vienne passent le harnais React : coordonnées, clic vers le même POI, huit orientations, option et repli, réduction des animations, dimensions 320/390/430.
- Les scénarios GPS simulé/retour au réel et George avec le MP3 réel passent. Les adaptateurs navigateur ne remplacent pas les services natifs sur iPhone.
- Le moteur Valhalla répond au trajet Fourvière → théâtre : 546 m, 405,153 s, 78 sommets au moment du contrôle ; aucune distance fictive.
- Installation cumulative séparée : `npm install`, TypeScript et 146 tests réussis. Exports iOS/Android de production et bundle iOS de développement compilés.
