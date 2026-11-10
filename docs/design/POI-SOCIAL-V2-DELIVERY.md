# Livraison V2 — POI immersifs, partage et préparation des contributions

Implémentation du [cahier V2](POI-SOCIAL-IMMERSIVE-V2.md) sur `codex/catia-mobile-preparation`, sans changement de Catia, des relevés GPS, du calcul XP ni du stockage de progression.

## A — UI et assets opérationnels

- Carte native sombre par défaut, palette bleu nuit / doré décoratif / turquoise. L'atlas local clair Vienne reste disponible dans les options pour le hors ligne. La carte n'est pas remplacée par une image.
- Huit silhouettes miniatures spécifiques aux lieux phares : temple d'Auguste et de Livie, théâtre de Vienne, Saint-Maurice, Saint-André, Fourvière, théâtre de Lugdunum, Saint-Jean, amphithéâtre des Trois Gaules. Dessins originaux stylisés des monuments actuels, pas des reconstitutions historiques certifiées.
- PNG transparents 3× et sources SVG ; pictogrammes V1 retouchés pour les autres lieux. Ni moteur 3D ni animation par POI. Les couleurs du sceau restent liées au contrôle, indépendamment des dorures de l'illustration.
- Halo sélectionné pulsant de façon bornée : huit variations sur environ 1,4 seconde, pas de boucle infinie. Respecte « Réduire les animations ». Les autres marqueurs restent statiques, avec snapshots ponctuels, clustering/culling et plafond de 96 marqueurs conservés.
- Bouton « + Contribuer » sur la carte et les fiches. Onglets « À propos », « Contributions », « Sources » ; les compteurs de contributions publiques ne sont pas inventés.
- Tous les fichiers du catalogue OSM introduit depuis la dernière livraison sont inclus dans la mise à jour Windows. Au contrôle du catalogue actuel : **765 fiches publiques uniques**, huit éditoriales et 757 imports après le dédoublonnage hérité. Les 791 candidats OSM sources restent présents. Aucun POI actuel n'a été supprimé par cette V2 et aucun n'est marqué vérifié automatiquement.

## B — Partage natif opérationnel avec fallback

`Share.share` ouvre la feuille native iOS/Android avec le titre et une référence publique du lieu (Wikipédia/OSM/Wikidata/POP). Le lien est HTTPS, sans identifiants personnels, coordonnées du joueur, carnet, XP, query ni fragment. Le helper accepte uniquement les domaines publics de référence attendus et n'utilise jamais de `fix` GPS.

**Limite explicite : il n'existe pas encore de domaine web Vestige avec pages de fiches/universal links.** Le destinataire lit donc la page source publique, pas une copie web de toute la fiche Vestige. Aucun faux lien Vestige n'est généré. Les 765 fiches ont un fallback accepté par le validateur de lien ; cela ne garantit pas la disponibilité permanente des sites externes. L'ouverture de la feuille native et Safari reste à vérifier sur iPhone.

## C — Préparation réelle, publication indisponible

Le formulaire propose lieu → contenu → sources/photos → aperçu. Coordonnées proposées depuis le GPS existant s'il est récent, déplacement sur une carte dédiée, champs latitude/longitude, catégorie, description/correction/anecdote/date, jusqu'à cinq références HTTPS, pseudo souhaité facultatif, photo et attribution/licence. Déplacer ce repère ne déplace pas l'explorateur et ne valide aucune découverte.

- Nouveaux lieux, enrichissements et signalements peuvent être préparés et enregistrés en **brouillons locaux réels**. Un brouillon incomplet est permis ; l'aperçu vérifie les champs obligatoires, les sources historiques, la position et les droits/confidentialité.
- Bibliothèque photo via `expo-image-picker ~58.0.10`, disponible dans Expo Go SDK 58. JPEG/PNG/WebP limités à 5 Mo et signature du fichier vérifiée ; fichier copié dans le dossier privé Documents de l'application pour le conserver après relance. Pas de caméra/microphone demandés. Une photo HEIC non convertie peut être refusée : choisir JPEG/PNG ou utiliser le recadrage. Le comportement réel du picker doit être testé sur iPhone.
- Aucune garantie de suppression EXIF : avertissement visible, aucune photo envoyée. Les photos préparées mais finalement non enregistrées peuvent rester localement ; « Effacer mes données de contribution locales » supprime aussi ce dossier.
- « Mes contributions » dans Profil : reprendre, supprimer un brouillon, voir les favoris privés et effacer les données de contribution. Écriture AsyncStorage sérialisée dans une clé distincte du carnet ; erreurs signalées, données illisibles préservées sauf effacement explicite. Limite de 50 brouillons locaux.
- Le pseudo demeure privé. Aucun compte public ni profil contributeur actif n'est simulé. Il n'y a donc pas de compte distant à supprimer ; l'effacement local existe.
- « Soumettre » est désactivé et indique pourquoi. Aucun état soumis/vérifié/accepté inventé, aucun appel réseau de publication, aucun XP de contribution. Le contenu des fiches publiques reste inchangé après sauvegarde.
- Soumissions en attente et contributions rejetées exclues de la visibilité publique. Contrat backend préparé dans [BACKEND-CONTRACT.md](../community/BACKEND-CONTRACT.md), mais ni authentification, ni modération, ni stockage distant ne sont déployés.

## D — Social léger limité

Favoris privés fonctionnels. Signalement préparé comme brouillon privé, **pas envoyé**. Profils publics opt-in, commentaires, réactions, abonnements, blocage/anti-spam serveur et XP de contribution restent à développer après l'infrastructure de publication/modération.

## Contrôles

- **61 tests réussis** : validation des sources/position/date/droits, sérialisation des écritures et relance du store, échecs de sauvegarde et récupération, partage sans données privées, visibilité publique et huit miniatures distinctes, plus tous les tests existants.
- TypeScript, lint, compatibilité des dépendances Expo et exports Hermes iOS/Android dans le Cloud.
- [Planche graphique](poi-preview.html), [320 px](poi-v2-preview-320.png), [390 px](poi-v2-preview-390.png), [430 px](poi-v2-preview-430.png). Vrais assets, 26 images chargées par planche, aucun débordement horizontal ou erreur JS. Ce ne sont pas des captures de carte native.
- Aucun fichier GLB/Blender/Catia, module de capteur GPS, calcul XP ou base de progression n'est modifié.
- **Aucun iPhone physique connecté au Cloud** : aucune validation de fluidité/FPS, de la feuille de partage ou des permissions/picker natifs sur appareil n'est revendiquée. PowerShell est préparé/relu mais pas exécuté sous Windows dans ce Cloud Linux.

## Windows et Expo Go

La mise à jour est désormais **cumulative depuis `2916df9` (avant POI V1)** : elle inclut tous les modules V1, le catalogue OSM, la V2, les assets et `package.json`/lock. Le paquet initial `5562db0` était différentiel depuis V1 et omettait notamment `PoiClusterMarker.tsx`, `src/components/poi/assets.ts` et le regroupement V1 si cette mise à jour intermédiaire n’avait pas été installée. Ce défaut de livraison est corrigé, sans changer le composant ni le GPS. Elle conserve les fichiers Catia et toutes les données de l'application. `scripts/windows/update-social-v2.ps1` télécharge un manifeste du commit fixé, vérifie les SHA256 avant copie et sauvegarde les fichiers existants dans un dossier voisin. Aucune suppression de fichier du projet.

Arrêter Metro, fermer Vestige dans Expo Go, exécuter le script depuis le dossier contenant `package.json`, puis **`npm.cmd install`** (nouvelle dépendance image-picker), et **`npx.cmd expo start --tunnel --clear`**. Un compte Expo gratuit reste nécessaire pour le tunnel SDK 58. Mettre Expo Go à jour pour SDK 58 ; le libellé de permission du client hôte peut mentionner Expo Go plutôt que Vestige. Les messages du plugin seront appliqués dans une future build autonome.

Parcours de contrôle :

1. Examiner les huit lieux phares et les POI importés. Aucun ne doit gagner une certification du seul fait des dorures. Tester les filtres et le zoom.
2. Sélectionner un lieu et vérifier le halo borné, puis activer « Réduire les animations » pour vérifier son absence de pulsation.
3. Contribuer depuis la carte : déplacer uniquement le repère du formulaire, saisir une proposition sourcée, choisir éventuellement une photo et son attribution, enregistrer.
4. Relancer l'app et reprendre le brouillon depuis Profil → Mes contributions. Vérifier photo, champs, statut local et absence de nouveau POI public/XP.
5. Depuis une fiche : parcourir les trois onglets, préparer correction/date/photo/signalement ; « Soumettre » doit rester indisponible.
6. Partager et ouvrir le lien source sans compte, puis vérifier qu'il ne contient aucune position personnelle ni progression.
7. Ajouter/retirer un favori, supprimer un brouillon et tester l'effacement des seules données de contribution. Carnet/XP/Catia doivent rester intacts.

Le script mainteneur `node scripts/windows/build-social-manifest.cjs` reconstruit le manifeste cumulatif (historique Git requis). Des tests vérifient la présence des dépendances POI inchangées et tous les SHA256. Le script Windows refuse un manifeste incomplet et vérifie aussi les fichiers après copie.

Validation du correctif de livraison : sur une copie de `2916df9` sans POI V1, le paquet original reproduit les absences de `PoiClusterMarker.tsx` et `poi/assets.ts`. Après application du paquet cumulatif : installation npm neuve, TypeScript, **63 tests** et exports Hermes iOS/Android réussis. Le PowerShell lui-même et le rendu iPhone restent à vérifier sur les appareils correspondants.
