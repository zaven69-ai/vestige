# Catia — préparation mobile et animation expérimentale

[Résultats, fichiers, limites du rig et test Expo Go](docs/avatars/catia/PREPARATION.md). Base retenue : 24 996 triangles. Idle/Walk/Run réels mais non approuvés ; Catia reste désactivée sur la carte.

# Prototype avatars Alex/Léa — préparation 3D

[État exact, fiches des six personnages, chaîne GLB/Blender et test Expo Go](docs/avatars/README.md). Les modèles Alex/Léa ne sont pas encore fournis : l’avatar actuel est conservé. Travail local, non publié.

# VESTIGE V3 — version locale

La V3 ajoute un atlas local, 27 lieux sourcés et un carnet SQLite. [Guide V3 : fonctionnement, limites, sources et procédure Windows/iPhone](docs/v3/README.md). La branche V3 n’a pas été publiée ; les instructions GitHub ci-dessous concernent les versions précédentes.

# VESTIGE

**Nouvel avatar :** branche `codex/premium-explorer-avatar`, personnage archéo-tech original en sprites 2.5D avec respiration, marche conditionnée au GPS et direction relative à la carte. Voir le [guide avatar et les trois propositions](docs/AVATAR_DESIGN.md).

**Charte officielle V1 :** branche `codex/official-brand-v1`, issue de la V2 complète. Palette bleu nuit, composants partagés, fiches en bottom sheet et récompenses après sauvegarde. Consultez le [design system](DESIGN_SYSTEM.md) et le [guide de test iPhone/Windows](docs/BRAND-VALIDATION.md).

**Logo :** l’original fourni sur GitHub est intégré sans redessin. Les exports d’icônes et le splash sont configurés ; leur rendu système se valide dans une build native, pas entièrement dans Expo Go.

Application **native iOS et Android**, Expo SDK 58, React Native et TypeScript. Le projet initial est conservé ; la navigation utilise maintenant Expo Router (`src/app`). Aucun backend ni abonnement requis pour cette version.

## Lancer sur un iPhone avec Expo Go

1. Récupérez le dossier `vestige` sur votre ordinateur et installez Node.js 22.13+ (Node 24 LTS conseillé).
2. Installez **Expo Go** depuis l’App Store. Il doit prendre en charge **Expo SDK 58**, utilisé par ce projet. Si votre version indique un SDK incompatible, mettez Expo Go à jour ; ne forcez pas une rétrogradation des dépendances.
3. Dans un terminal, depuis le dossier du projet :

   ```bash
   npm ci
   npm start
   ```

4. Connectez l’ordinateur et l’iPhone au même Wi-Fi. Scannez le QR code avec l’appareil photo de l’iPhone et ouvrez le lien dans Expo Go. Autorisez le réseau local si iOS le demande.
5. Touchez **ACTIVER** sur la carte. Autorisez la localisation « Lorsque l’app est active » et la **Position exacte**. Aucun accès en arrière-plan n’est demandé.
6. Si le Wi-Fi bloque la connexion, essayez `npx expo start --tunnel` (Internet requis ; Expo peut proposer l’installation de son outil de tunnel). Depuis un environnement cloud, le tunnel est généralement nécessaire. Aucun tunnel n’est lancé automatiquement ici.

Sur Android, scannez le QR code dans Expo Go. Aucun compte Apple développeur, clé Google Maps personnelle ou abonnement n’est requis pour tester les cartes **dans Expo Go**. Une distribution autonome Android demandera une configuration Google Maps et une clé personnelle ; l’accès gratuit dépend des conditions et quotas de Google. iOS utilise Apple Plans.

## Ce qui est implémenté

- Carte native zoomable, orientable, changement de ville, sélection de marqueurs, recentrage et marqueur de position réelle.
- GPS au premier plan, permission explicite, gestion des refus et des erreurs, arrêt en arrière-plan et reprise si autorisé.
- 8 monuments réels : temple d’Auguste et de Livie, théâtre antique, cathédrale Saint-Maurice et Saint-André-le-Bas à Vienne ; Fourvière, théâtre de Lugdunum, Saint-Jean et amphithéâtre des Trois Gaules à Lyon.
- Fiches, photos intégrées, sources Wikipédia et crédits/licences Wikimedia Commons. Coordonnées extraites des sources. Les liens ouvrent le navigateur externe ; l’application reste native.
- Découverte **manuelle depuis la fiche** à 100 m maximum, uniquement avec un relevé de moins de 30 secondes et une précision de 50 m ou mieux. Aucun GPS simulé ni découverte à distance.
- Sauvegarde locale du carnet avant attribution des XP ; attribution unique par monument. Niveau supplémentaire tous les 400 XP. Aucun compte et aucune synchronisation.
- Cinq onglets : Explorer, Parcours, Carnet, Défis, Profil.
- Deux parcours à étapes avec progression et distances à vol d’oiseau ; quatre défis permanents validés à partir du carnet.
- Photos et fiches disponibles hors ligne. Les fonds de carte et les liens externes nécessitent Internet.

## Test sur le terrain

- Sans autoriser le GPS : naviguer dans les deux villes, ouvrir les fiches ; aucune découverte ne doit être possible.
- Autoriser la localisation exacte : vérifier le marqueur bleu et comparer avec Plans. En intérieur, la précision peut être insuffisante.
- À plus de 100 m d’un monument : validation bloquée. À moins de 100 m, avec une précision de 50 m ou mieux : ouvrir sa fiche, toucher « Découvrir ce monument ».
- Vérifier le carnet, les XP, les défis et le parcours ; fermer puis rouvrir l’app et vérifier leur conservation. Une seconde visite ne doit pas ajouter d’XP.
- Passer en arrière-plan puis revenir : reprise du GPS si autorisé. Couper la localisation et vérifier le message ; réactiver puis toucher « Actualiser ma position » dans Profil.
- En dehors de Lyon/Vienne, l’exploration des fiches reste possible ; le carnet reste vide tant qu’aucune visite réelle n’a été validée.

## Vérifications techniques

```bash
npm run typecheck
npm run lint
npm test
npx expo-doctor
npx expo export --platform all
```

Les tests Node vérifient les distances, la portée GPS, la fraîcheur/précision, les niveaux, la restauration du carnet et l’absence de double comptage des XP. Les exports sont des bundles JavaScript/Hermes, pas des binaires signés ni une validation sur appareil.

## Reste à développer / à valider

- Validation visuelle et GPS sur de vrais iPhone et Android : aucun appareil mobile n’était connecté à cet environnement de développement.
- Guidage piéton, itinéraires tenant compte des rues, accessibilité et horaires. Les parcours actuels sont des étapes suggérées, pas un calculateur d’itinéraire.
- Carte artistique personnalisée identique sur les deux plateformes : le style natif Apple diffère de celui de Google. Avatar 2D original avec déplacement GPS interpolé ; aucun moteur 3D ni animation de marche artificielle.
- Comptes, synchronisation, sauvegarde distante/export utilisateur et anti-triche GPS avancée.
- Notifications, détection automatique en arrière-plan, défis quotidiens et contenu supplémentaire.
- Carte hors ligne, publication App Store / Play Store, clés et builds autonomes.
- Audit éditorial de terrain des coordonnées, accès et textes avant publication publique.

Désinstaller l’app efface la progression locale. VESTIGE ne conserve pas les positions GPS ; les fournisseurs de cartes ont leurs propres traitements de données.
