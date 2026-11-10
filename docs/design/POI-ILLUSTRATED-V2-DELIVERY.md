# Intégration des sept catégories illustrées

Branche `codex/catia-mobile-preparation`. Cette livraison remplace réellement les anciens pictogrammes gris dans le composant `PoiGlyph`, utilisé par `HistoricalMarker` sur la carte et par les badges des fiches.

## Fichiers livrés et variantes

- Sept PNG individuels à fond transparent : [assets/poi/illustrated](../../assets/poi/illustrated). Temple et vestiges, château et fortifications, édifice religieux, musée, patrimoine industriel, nature, autre patrimoine.
- Chaque illustration est une scène en couleur avec architecture/paysage détaillé, matériaux, ombres, cadre métallique doré et pointe de repère. Il ne s'agit pas de recolorations des anciens SVG.
- Six PNG de contrôle dans `assets/poi/review` : éditorial vérifié, éditorial à contrôler, import non vérifié, communauté non contrôlée, communauté en attente, communauté vérifiée.
- Trois PNG de progression dans `assets/poi/discovery` : à découvrir, découvert, complété. La proximité et la sélection ont en plus un anneau extérieur.
- Les trois couches sont indépendantes : 7 × 6 × 3 combinaisons sans 126 copies des grandes illustrations. Le sceau de contrôle reste en bas à droite ; la progression en haut à gauche.
- `src/components/poi/illustrated.ts` référence tous les fichiers par `require` littéral Metro. `PoiGlyph.tsx` compose les couches ; aucune référence aux anciens pictogrammes n'est utilisée pour le dessin central.
- `scripts/poi/build-seals.cjs` reproduit les petits sceaux UI ; les illustrations de production sont les sept PNG livrés. `png-inspect.cjs` contrôle les pixels/transparences sans modifier les images.

## Sémantique et préservation

Le cadre doré ne certifie rien. Les imports OSM/Wikidata restent non vérifiés ; les huit fiches initiales restent à contrôler. Aucun champ de validation, coordonnées, XP, ID de POI, progression ou modèle Catia n'est changé. Une découverte n'est pas une vérification historique. « Complété » n'est utilisé que comme exemple de légende tant qu'aucun mécanisme réel de complétion n'existe.

Les scènes illustrent les catégories et ne sont pas présentées comme des photos des lieux nommés. Les photos documentaires et leurs licences demeurent dans les fiches. Les anciennes miniatures/pictogrammes sont conservés dans le dépôt, sans être rendus par le composant actif.

## Performances et interface

Culling, filtres et regroupement existants conservés, plafond de 96 marqueurs POI. Les groupes affichent leur vrai nombre avec un habillage nuit/doré. Les marqueurs restent en snapshots stables, avec `tracksViewChanges=false`, rafraîchissement à la fin du chargement et seulement quelques variations bornées lors de la sélection. Réglage « Réduire les animations » conservé. Pas de nouvelle dépendance native ni de 3D par POI ; pas de fondu Image Android qui pourrait figer une vignette partiellement transparente.

Les images source sont en haute définition et partagées par catégorie. Leur téléchargement initial est plus important que celui des anciens pictogrammes ; les performances et le décodage réels restent à vérifier sur téléphone.

## Contribuer et partage

L'interface existante est incluse dans la mise à jour cumulative : bouton Contribuer sur carte/fiche, formulaire lieu/contenu/sources/photo/aperçu, brouillons réellement conservés localement, reprise depuis Profil, favoris privés et préparation de signalements. Le partage natif ouvre un lien public de référence sans coordonnées du joueur ni XP dans l'URL.

Publication/modération/authentification distantes non déployées. Aucun brouillon n'est annoncé comme publié, aucun compte ou XP de contribution n'est simulé. Le partage utilise le fallback source publique, car les pages web/universal links Vestige restent à créer. Détails : [livraison sociale V2](POI-SOCIAL-V2-DELIVERY.md).

## Vérifications et planches

- Contrôle de vrais pixels PNG : RGBA, nombreux pixels totalement transparents, coins transparents à la tolérance d'anticrénelage, scène colorée substantielle, sept fichiers distincts. Sceaux séparés contrôlés également.
- Tests du paquet : tous les modules POI et tous les PNG référencés par leurs `require` doivent être inclus dans le manifeste cumulatif et correspondre à leur SHA256. Cela couvre notamment `PoiClusterMarker.tsx` et tous les registres d'assets.
- [Planche des couches réelles](poi-preview.html), captures [320 px](poi-illustrated-320.png), [390 px](poi-illustrated-390.png), [430 px](poi-illustrated-430.png). Ce sont des contrôles graphiques navigateur, pas des captures de carte iPhone. Les illustrations et les couches employées sont les mêmes que dans l'app.
- TypeScript, lint, tests et exports Hermes iOS/Android vérifiés dans le Cloud. Une ancienne copie d'avant POI V1 est mise à jour uniquement avec le paquet cumulatif puis compilée pour détecter les dépendances omises.
- Aucun iPhone physique connecté. Le rendu natif, la lisibilité à taille carte, le partage et le sélecteur photo nécessitent encore l'essai sur appareil. Le PowerShell est relu mais non exécuté sous Windows dans cet environnement Linux.

## Mise à jour Windows

Arrêter Metro avec Ctrl+C, fermer Vestige dans Expo Go, récupérer le script `scripts/windows/update-social-v2.ps1` du commit de livraison et l'exécuter depuis le dossier contenant `package.json`. Il télécharge tout le correctif cumulatif depuis avant V1, contrôle les SHA256 avant et après copie et sauvegarde les fichiers remplacés. Aucune suppression de fichier ni effacement des données du téléphone.

Lancer ensuite `npm.cmd install` pour garantir les dépendances sociales/photo de la V2, puis `npx.cmd expo start --tunnel --clear`. Scanner le nouveau QR avec un Expo Go compatible SDK 58.

Sur l'iPhone : zoomer dans les groupes pour voir les illustrations individuelles, comparer les catégories, sélectionner/découvrir un vrai lieu, ouvrir la légende et filtrer. Vérifier que le sceau reste non vérifié après découverte ; tester ensuite les brouillons privés et le partage d'une fiche. Ne pas activer Catia sur la carte et ne pas désinstaller Expo Go pour ce test.

Résultat de livraison : **66 tests réussis**, TypeScript et lint réussis. Sur une copie de `2916df9` mise à jour uniquement par le paquet cumulatif, `npm install`, TypeScript, les 66 tests et les exports Hermes iOS/Android passent. Les sept illustrations et les neuf sceaux sont présents, octet pour octet, dans les assets réellement exportés (16 SHA256 retrouvés). Contrôles navigateur : 69 images chargées, aucune erreur JS ni débordement aux trois largeurs. Aucun test physique iPhone n’est revendiqué.
