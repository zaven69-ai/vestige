# Issue #11 — six aventures lyonnaises

Deux parcours sont publiés dans le catalogue : **Lugdunum : aux origines de Lyon** et **Les secrets du Lyon médiéval**. Chacun comprend trois étapes, des notices originales courtes, des références consultables et le guidage piéton existant dans Explorer. Les quatre autres thèmes apparaissent en préparation, sans étapes ni bouton de départ actif. Les illustrations typographiques des six cartes sont originales, sans photo ou circuit tiers réutilisé.

## Vérification documentaire

Sources de départ consultées le 11 novembre 2026 :

- Les trois pages CHRD fournies dans l'issue sont accessibles (Jean Moulin, lieux secrets, répression). Elles restent des références de recherche pour le parcours Résistance, pas un circuit recopié. Aucun récit de persécution, nom de victime ou récompense associée n'est ajouté.
- La Métropole décrit le dispositif Explore Lyon antique, le musée et les vestiges de la colline ; Lugdunum documente le grand théâtre et l'odéon :
  - https://www.grandlyon.com/actualite/plongez-dans-les-vestiges-de-la-ville-a-lepoque-romaine-avec-explore-lyon-antique
  - https://lugdunum.grandlyon.com/fr/un-musee-de-sites/theatres-romains
- Les pages Visiter Lyon fournies (crime, Vieux Lyon, cours de Croix-Rousse, traboules) répondent HTTP 403 dans l'environnement. Elles ne sont pas déclarées consultées ou validées. Crime, Canuts et légendes restent en préparation.
- Pour le Vieux Lyon, les références complémentaires accessibles sont :
  - https://fr.wikipedia.org/wiki/Cath%C3%A9drale_Saint-Jean_de_Lyon : le quartier cathédral médiéval, au sein du Vieux Lyon médiéval et Renaissance.
  - https://www.gadagne-lyon.fr/mhl et https://fr.wikipedia.org/wiki/H%C3%B4tel_de_Gadagne : le musée d'histoire dans l'ensemble Renaissance. La notice distingue explicitement Renaissance et Moyen Âge.
  - https://fr.wikipedia.org/wiki/%C3%89glise_Saint-Paul_de_Lyon : composantes romanes et gothiques de Saint-Paul.

La publication concerne ces **notices documentées limitées à ces faits**, pas une certification globale des fiches POI existantes. Aucun statut de vérification POI n'est modifié. Aucun auteur humain ou comité d'approbation n'est inventé. Les textes ne sont pas des transcriptions des pages sources ou d'un circuit CHRD/Office du tourisme.

## Étapes et routage

Lugdunum : `osm-way-88526510` (musée, repère extérieur contemporain) → `theatre-lyon` → `osm-way-88526506` (odéon). Les thermes rue des Farges et les tombeaux place Eugène-Wernert ne sont pas ajoutés : aucun identifiant correspondant n'a été trouvé dans le catalogue existant, et l'issue interdit d'inventer des étapes. Le musée est documenté dans les sources institutionnelles et constitue le troisième POI existant. Ce parcours demeure centré sur le site plutôt que de relier des vestiges éloignés.

Vieux Lyon : `saint-jean` → `osm-way-700244364` (Gadagne) → `osm-way-60798750` (Saint-Paul). Aucune traboule ni cour privée n'est nécessaire.

Tous les identifiants ont été contrôlés dans le catalogue final exporté, après dédoublonnage et filtres. Les coordonnées canoniques des POI ne changent pas. Les points d'approche sont les points piétons retournés par Valhalla pour ces repères : ils ne garantissent ni une porte d'entrée ni un accès ouvert. Cela évite notamment de demander au joueur d'atteindre le centre d'une église ou d'un musée fermé. Chaque étape rappelle de rester dans les espaces publics accessibles.

Contrôles réels Valhalla piéton :

| Liaison | Distance moteur | Temps moteur |
|---|---:|---:|
| Musée Lugdunum → grand théâtre | 259 m | 210,009 s |
| Grand théâtre → odéon | 157 m | 109,496 s |
| Saint-Jean → Gadagne | 583 m | 430,134 s |
| Gadagne → Saint-Paul | 539 m | 377,066 s |

Ces valeurs servent au contrôle technique, ne sont pas des temps de visite ni des marches mesurées. Le catalogue n'affiche aucune durée arbitraire ; Explorer calcule le trajet réellement depuis la position courante et chaque étape suivante. Le secteur Fourvière est en pente et peut comporter des escaliers. Vieux Lyon présente des pavés ; aucun parcours n'est annoncé accessible PMR. Les horaires, fermetures et obstacles ne peuvent être garantis par le routage et restent à vérifier sur place. Aucun horaire n'est inventé.

## Architecture et protections

`src/data/adventures/lyon.json` porte six thèmes typés : période, public conseillé (choix éditorial, pas classification officielle), difficulté, version, origine editorial/community, statut, étapes et sources. `playableAdventure` bloque brouillons, origine communautaire et étapes non documentées. Le registre de guidage n'ajoute que les aventures publiées dont les POI existent. Il conserve tous les anciens identifiants de parcours pour relire les sessions sauvegardées ; les parcours Vienne restent dans le catalogue. L'ancien parcours générique Lyon reste disponible dans le registre et les outils développeur pour compatibilité, mais n'est pas présenté comme une des six nouvelles aventures documentées.

`AdventureCard` ouvre Explorer avec le parcours choisi, et `GuidedVisitFooter` expose la notice, les accès et les sources à l'arrivée ou à l'ouverture de l'étape. Pas de deuxième carte. Les étapes peuvent être ignorées explicitement (statut skipped), sans découverte ni XP. Leur validation sur ces aventures exige l’arrivée GPS dans l’interface et une seconde vérification du relevé natif récent/précis dans le provider. La simulation n’enregistre qu’une démonstration en mémoire. La progression de visite reste distincte du carnet. Les badges « étapes sourcées » et « à pied » qualifient le parcours, ne sont pas des récompenses.

Aucun enregistrement audio n'est généré ou approuvé : les étapes indiquent Audio en préparation. George demeure la démo privée manuelle rue Mercière. Le statut documentaire d'une étape ne remplit jamais l'approbation humaine/versionnée du moteur audio. En simulation, les visites restent éphémères et les protections XP restent inchangées.

## Essai Expo Go iPhone

Après mise à jour cumulative Windows, `npm.cmd install`, puis `npx.cmd expo start --tunnel --clear --port 8088`, scanner le nouveau QR code sans désinstaller l'application.

1. Parcours : vérifier les six cartes, les deux statuts publiés, les quatre Bientôt désactivés, les âges conseillés et l'absence de durée inventée.
2. Ouvrir Étapes et sources sur Lugdunum, puis Commencer : Explorer doit afficher l'étape musée et le vrai guidage.
3. En mode développeur, maintenir le parcours choisi ou le reprendre depuis Parcours ; utiliser l'appui long confirmé pour approcher les repères. Vérifier arrivée, notice sourcée et Étape suivante sur les trois étapes, sans XP simulé.
4. Refaire Saint-Jean → Gadagne → Saint-Paul. Vérifier la distinction Renaissance/Moyen Âge et les références.
5. Quitter/reprendre, redémarrer, revenir au GPS réel : les étapes réelles et le carnet doivent rester distincts de la démonstration.
6. Tester Catia/joystick, les miniatures de Lyon et Vienne, George lecture/pause/reprise, réseau coupé et permissions refusées.
7. Sur place, vérifier pentes, escaliers, accès réellement ouverts et placement des points d'approche. Les calculs moteurs ne valident pas une accessibilité physique permanente.

Validation physique iPhone et marche sur site : **en attente**. Les tests automatisés et exports ne remplacent pas ces contrôles. Aucun nouveau module natif n'est ajouté.

### Vérifications de livraison

151 tests Node passent, dont le catalogue/publication, le véritable bouton AdventureCard vers Explorer, la sauvegarde des trois étapes et le verrouillage du pied de fiche tant qu'une arrivée réelle n'est pas confirmée. TypeScript, lint Expo et lint sans cache passent. Les scénarios GPS simulé/retour au réel et George avec le MP3 réel passent. L'installation cumulative séparée, les exports iOS/Android et le bundle iOS de développement sont vérifiés. Ces contrôles ne constituent pas un essai matériel iPhone ou une marche sur site.
