# Issue #9 — temple miniature dans Explorer

## Solution et limites techniques

La carte existante utilise `react-native-maps 1.29.11`, Expo SDK 58 et les vues natives Image/Marker. Catia reste un sprite animé issu de son modèle ; les autres POI conservent leurs PNG dorés. Aucun moteur cartographique, module natif ni dépendance n'est ajouté.

Un mesh Three.js ne peut pas être inséré dans la scène MapKit/Google Maps avec cette stack. Superposer un Canvas GL créerait un second rendu et demanderait une synchronisation caméra/projection/profondeur qui n'est pas fournie par `react-native-maps`. Ce pilote utilise donc **une miniature 2.5D pré-calculée à partir d'un vrai modèle Blender**, pas un mesh géo-ancré ni une 3D interactive dans la carte. Les fichiers Blender et GLB sont fournis comme sources hors exécution ; aucun n'est chargé sur la carte.

## Asset original et références

Le modèle procédural représente de façon simplifiée l'état actuel restauré : façade hexastyle (six colonnes), six positions de colonnes par côté en comptant les angles, ordre corinthien suggéré, cannelures, podium haut, escalier frontal, cella et mur arrière sans colonnade (sine postico), fronton triangulaire et toiture. La façade est orientée à l'est dans le modèle. Les ornements des chapiteaux sont des simplifications graphiques, pas des copies de sculptures.

Références visuelles/documentaires consultées pour ce pilote :

- [Office de tourisme Vienne Condrieu — Temple](https://www.vienne-condrieu.com/patrimoine-culturel/temple-dauguste-et-de-livie-vienne/).
- [Description architecturale et photographies — Wikipédia](https://fr.wikipedia.org/wiki/Temple_d%27Auguste_et_de_Livie) : dimensions de référence 27 × 14,25 m et hauteur 17,36 m ; la maquette simplifie la hauteur à environ 17 m et les détails.
- [Photographie existante du catalogue — Jacques MOSSOT, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Vienne_-_Temple_d%27Auguste_et_de_Julie_-2.JPG), déjà attribuée dans la fiche. Elle sert de référence visuelle, aucun pixel n'est intégré aux textures du modèle.

Aucune texture ni modèle externe n'est réutilisé. Le modèle, son code et les rendus sont originaux pour Vestige, sous MIT (notice dans le dossier d'assets). Aucune génération payante n'est utilisée.

Ce n'est **pas une restitution de l'Antiquité** : aucune statue, polychromie, dédicace inventée ou environnement de forum reconstruit n'est ajouté. Les éléments restaurés actuels restent stylisés. Le socle circulaire bleu nuit/or est un décor d'interface Vestige, pas un élément archéologique. La création de l'illustration ne modifie aucun statut historique ou statut de vérification du POI.

## Affichage effectif dans Explorer

- Identifiant unique conservé : `auguste`. Coordonnées du POI inchangées : **45.5255, 4.8742**. Le point d'approche du parcours reste distinct et inchangé. L'image est ancrée à ce point du catalogue ; sa taille en pixels ne représente pas une emprise métrique exacte au sol.
- Le composant `MonumentMiniatureMarker` est utilisé par les POI individuels et les étapes actives du parcours. Il délègue immédiatement au marqueur illustré existant pour tout autre lieu. Aucun doublon du temple n'est ajouté.
- Vue rapprochée : `latitudeDelta <= 0.009`. L'image varie de 96 à 128 points d'interface selon le zoom et la proximité projetée des autres POI. Une unique analyse linéaire calcule cette taille ; aucun monument n'est retiré pour réduire la densité.
- Vue distante ou option désactivée : marqueur doré classique ; les groupes continuent à utiliser leur logique existante. La miniature ne force pas le temple hors d'un groupe éloigné.
- Huit vues orthographiques, choisies par pas de 45° selon l'orientation de la carte. La projection utilise un biais artistique de trois-quarts pour rester lisible ; elle ne prétend pas reproduire exactement le pitch ou la perspective de MapKit. Les rotations entre vues sont discrètes, pas un mouvement 3D continu.
- PNG transparents 1×/2×/3× : 128/256/384 pixels. Huit bitmaps à 3× représentent environ 4,5 Mio de pixels décodés si tous sont gardés en cache. Le grand aperçu n'est utilisé que dans la fiche.
- Apparition légère de 220 ms, supprimée si les animations réduites sont demandées. Les changements de vue/sélection suivent l'événement de chargement ; `tracksViewChanges` est ensuite désactivé. Pas de pulsation infinie ni de contexte GL.
- Catia garde son `zIndex` 100, supérieur à celui de la miniature (8, ou 30 si sélectionnée). Les autres marqueurs peuvent rester au-dessus de la miniature pour limiter leur masquage. Le socle reste borné en taille ; une illustration peut ponctuellement recouvrir une petite portion du tracé, comme un marqueur classique.
- Un appui sur la miniature ouvre directement `MonumentBottomSheet` avec **le même objet POI et sa fiche existante**, y compris les commandes de guidage/audio. Le repli doré conserve sa sélection normale.
- Une légende « Temple · 2.5D » et le statut de provenance sont affichés. Le temple du catalogue reste **non vérifié** ; le marqueur ne reçoit aucune approbation automatique. Découverte et sélection restent indépendantes de la vérification.
- Options de carte → **Monuments miniatures 2.5D** pour comparer avec les marqueurs classiques. Le réglage est limité à la session d'interface et ne touche pas aux données sauvegardées.

## Repli et extensibilité

Une entrée d'asset inconnue, une option désactivée, une vue distante ou une erreur de chargement de l'image rétablit le composant doré existant. Le paquet et les tests vérifient les 24 PNG avant livraison : un `require` statique physiquement manquant empêcherait Metro de compiler et ne peut pas être rattrapé après coup par React.

`src/lib/miniatures/assets.ts` définit un pack par POI avec vues, aperçu, description et sources. Seul le temple est enregistré. Le théâtre et Cybèle ne disposent d'aucun faux placeholder : leurs modèles et références devront être réalisés avant enregistrement. La politique de zoom est séparée du composant de carte. Le modèle source contient environ 54 964 triangles après modificateurs : il sert à la génération hors téléphone ; son budget devrait être revu avant une future intégration mesh mobile.

## Reproduction

```bash
blender -b --threads 2 --python scripts/monuments/build-auguste.py
```

Blender 4.3.2, Cycles CPU, 64 échantillons, sans débruitage natif supplémentaire. Le script produit la source `.blend`, un GLB statique, huit familles PNG et un aperçu. Il ne lit ni ne modifie Catia. Les valeurs de la géométrie sont des proportions d'illustration, pas un relevé photogrammétrique.

## Tests et essai iPhone

Tests automatisés : zoom/option, taille bornée et densité sans suppression de POI, quantification des angles, transparence et tailles des 24 PNG, coordonnées canoniques, ouverture du même identifiant, conservation du statut non vérifié, repli sans pack. Le harnais `node scripts/monuments/check-miniature-browser.cjs` monte le vrai composant React avec des substituts DOM pour les services natifs : orientation, chargement puis arrêt du suivi, clic, réduction des animations, erreur d'image et mises en page 320/390/430 px. Ces captures **ne sont pas des captures iPhone** et ne prouvent pas le rendu de MapKit ni 60 fps.

Après mise à jour cumulative Windows et `npm.cmd install`, lancer `npx.cmd expo start --tunnel --clear --port 8088`, puis scanner le nouveau QR code dans Expo Go. Si le tunnel signé demande une connexion, exécuter `npx.cmd expo login` ; les alternatives existantes ngrok/LAN restent disponibles.

1. Explorer → Développeur → Activer le mode test à Vienne → Téléporter · Temple d'Auguste et de Livie. Zoomer jusqu'à la vue rapprochée si nécessaire.
2. Vérifier l'apparence entière du temple, son statut, Catia et son halo. Tourner la carte ; contrôler les vues sans effet de clignotement durable.
3. Appuyer sur la miniature : fiche existante, photographie, aperçu 2.5D et sources doivent s'ouvrir. Fermer la fiche et revenir à la même carte.
4. Reculer le zoom : vérifier le marqueur doré ou le groupe, puis zoomer à nouveau. Désactiver/réactiver Monuments miniatures 2.5D.
5. Tester Vienne antique, s'approcher au joystick puis avec le vrai GPS : trajet, arrivée, étape suivante et XP doivent garder leur fonctionnement précédent.
6. Lire George, mettre en pause/reprendre, déplacer Catia et tourner la carte avec le lecteur visible. Vérifier que les contrôles restent accessibles.
7. Activer Réduire les animations dans iOS puis recommencer. Vérifier la fluidité et la consommation sur appareil réel, notamment en centre-ville dense.

La validation physique Expo Go iPhone et la mesure de débit d'images restent **à effectuer** : aucun téléphone n'est connecté au Cloud. Aucun objectif 60 fps n'est présenté comme mesuré.

### Résultats de cette livraison

- 143 tests Node passent, dont 5 tests nouveaux de miniature ; TypeScript, lint Expo et lint sans cache passent.
- Le harnais du composant miniature passe (clic, vues, chargement/arrêt du suivi, repli, option, animations réduites, trois largeurs d'écran).
- Les scénarios React GPS/joystick et George avec le MP3 réel passent ; le harnais George vérifie pause/reprise/réécoute et absence de XP ou d'étape attribuée à la fin.
- `npm install`, TypeScript et les 143 tests passent aussi dans un dossier séparé mis à jour par le paquet cumulatif.
- Le bundle iOS de développement contient réellement la miniature, ses huit assets, Catia et le lecteur George. Les exports iOS et Android de production réussissent.
- Ces contrôles ne constituent ni une validation matérielle Expo Go iPhone, ni une mesure de performance native ; le plan de test ci-dessus reste à exécuter sur téléphone.
