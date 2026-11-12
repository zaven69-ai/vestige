# Communauté Vestige — issue #12

## Version livrée et périmètre réel

La phase A fonctionne sans compte ni serveur : stockage local versionné séparé du carnet/XP, profil partageable (pseudo, bio, avatar symbolique, ville facultative), création/édition/suppression de découvertes et de parcours, brouillons, fil local récent, filtres Lyon/type/thème, enregistrements privés, signalement/masquage et file locale. Aucun utilisateur, publication, like ou commentaire fictif n'est préchargé. L'accès se fait depuis Parcours et Profil, et une découverte peut partir d'une fiche POI. Les anciens brouillons et favoris de contribution conservent leur propre clé et écran.

Un parcours comporte 2 à 20 POI distincts du catalogue existant. L'ordre peut être modifié dans le brouillon. L'aperçu carte montre uniquement leurs coordonnées publiques, sans inventer de tracé piéton ni afficher la position du joueur. Après ajout au fil local, les étapes sont figées pour que les sessions de guidage restent cohérentes ; titre et description restent éditables. Pour modifier le trajet, créer un autre parcours.

« Lancer dans Explorer » réutilise le moteur existant, son calcul piéton réel, ses arrivées et ses checkpoints. Les parcours locaux sont hydratés avant la restauration des visites. Un parcours supprimé devient inactif ; il ne redirige pas vers une autre visite. En GPS simulé, la visite reste éphémère et les découvertes n'accordent pas d'XP réel. Une création communautaire ne modifie aucun POI du catalogue, sa provenance, ses récompenses ou ses miniatures.

Chaque création est `community_published_unverified`. Les deux autres statuts du futur réseau sont `historically_verified` et `live_editorial_approved` ; aucun contrôle client n'accorde ces statuts. Les étapes communautaires ont un `storyId` vide, aucune notice historique éditoriale ni approbation audio. Le texte libre n'entre jamais dans les scripts audio. George conserve son lecteur/démonstration privée manuelle. Les parcours éditoriaux documentés de l'issue #11 restent inchangés.

## Partage utilisable sans backend

La feuille native iOS/Android transmet le texte, le profil volontairement renseigné et les identifiants publics des étapes, sous forme d'un code `VESTIGE1:`. Le destinataire colle ce code dans Communauté → Importer, vérifie l'aperçu, confirme, puis peut enregistrer et lancer la copie dans Explorer. Deux stockages locaux n'échangent aucune donnée automatiquement. Une copie importée affiche une identité non authentifiée ; deux pseudos identiques ne sont pas fusionnés. L'auteur local ne peut pas éditer une copie importée ; elle peut être supprimée de l'appareil. Il n'y a ni synchronisation des modifications, ni révocation des copies déjà envoyées.

Le lien généré par `expo-linking.createURL` ouvre l'écran d'import. Dans Expo Go, il dépend du serveur Metro/tunnel en cours ; ce n'est pas un lien universel de production durable. Le code est le secours portable. Aucun site, domaine d'Universal Links ni hébergement de parcours n'est inventé.

Le payload est construit par liste blanche : aucun relevé GPS, trajet de l'utilisateur, journal, XP, badge privé, identifiant de compte, droit de propriété, photo privée ou approbation n'est partagé. L'import vérifie longueur (16 000 caractères), version, format, identifiants connus, nombre d'étapes et liens HTTPS avant écriture et confirmation. Les données ajoutées par un expéditeur pour usurper un statut/propriétaire/audio sont écartées.

Les photos restent locales : trois maximum, 5 Mo chacune, JPEG/PNG/WebP, choix volontaire et confirmation des droits/consentement. La première est la couverture locale. Les photos retirées ou les nouvelles photos d'un formulaire annulé sont nettoyées ; les fichiers des anciens brouillons de contribution ne sont pas effacés. `exif:false` demande de ne pas exposer EXIF à l'application ; ce paramètre n'est **pas** présenté comme une garantie d'effacement des métadonnées du fichier. Les photos ne sont donc jamais exportées dans le partage de cette version. Avant tout upload distant, un service devra réencoder les images pour supprimer EXIF et valider les signatures d'octets.

Pas de carte récapitulative exportée en image pour ce MVP. Pas de DMs, likes ou commentaires sans modération opérationnelle. Le bouton de partage de fiche POI conserve le lien de référence publique existant ; un bouton séparé prépare une découverte communautaire. Un contrôle de partage est présent à la dernière étape et un panneau s'affiche à la fin du parcours, sans prétendre valider les étapes ignorées.

## Phase B : schéma de préparation, aucun backend activé

Aucun client Supabase, URL de projet ou secret n'est ajouté. La migration `supabase/drafts/202611110001_community.sql` est **non appliquée** et doit passer par un projet staging Supabase.

Tables : profils, catalogue d'identifiants POI, contenus versionnés, enregistrements privés, signalements privés et métadonnées photo. RLS : brouillons seulement pour l'auteur ; lecture publique uniquement des contenus publics acceptés par la modération ; édition/suppression par auteur ; signalements/enregistrements isolés. Tout changement client remet le contenu en `pending`/`community_published_unverified` ; aucun client ne s'auto-approuve. La revue requiert le service de confiance. Limites transactionnelles : 20 créations/jour, 10 signalements/heure, contraintes de taille et d'étapes. Les identifiants canoniques du catalogue doivent être chargés par le service avant toute insertion ; les lieux inconnus/dupliqués sont refusés.

Bucket privé de quarantaine, limite de 5 Mo et liste MIME. **Aucune policy client d'upload ni de lecture des objets** n'est ouverte : accès fermé tant que le service de validation et les URLs signées ne sont pas implémentés. Le service devra vérifier ownership, quota de trois photos, signature des octets, réencodage EXIF, modération et lecture autorisée. Supprimer les lignes ne suffit pas à supprimer les objets : nettoyage Storage et effacement du compte Auth doivent aussi être raccordés.

Avant de prétendre à un réseau opérationnel :

1. Configurer Supabase Auth pseudonyme, projet staging, stockage et catalogue canonique ; ne jamais mettre une clé service-role dans Expo.
2. Raccorder un dépôt distant avec authentification persistée selon les recommandations Expo/Supabase ; le MVP utilise le dépôt local injectable uniquement.
3. Ajouter service d'uploads/rate limiting, validation des champs publics et modération des profils/contenus/photos ; former l'équipe qui traite la file, prévoir recours et notifications de décision.
4. Implémenter suppression de compte, contenus et objets, politique de conservation, consentements et informations RGPD adaptés aux mineurs. La suppression locale actuelle n'efface pas une copie déjà partagée.
5. Héberger les liens publics et configurer Universal/App Links dans un build signé ; tester expiration, révocation, droits de lecture et liens entrants.
6. Exécuter les essais Auth/API/Storage avec deux **vrais** comptes sur staging et deux iPhone. Les fixtures PostgreSQL ne valident pas GoTrue, Storage ou une équipe de modération.

La migration ne publie pas de textes historiques et ne fournit jamais une approbation audio : le pipeline versionné d'approbation humaine reste indépendant.

## Vérification et essai iPhone

Tests unitaires : CRUD/persistance et file sérialisée, échec disque et récupération, import malveillant/inconnu/dupliqué/trop long, consentement photo, absence de GPS et données privées dans le partage, isolation de deux stockages, refus d'édition d'une copie importée, checkpoints, absence d'admission audio, signalements/quotas et effacement ciblé.

`scripts/community/check-community-browser.cjs` teste les véritables écrans React et providers avec adaptateurs DOM pour les services natifs : profil, création ordonnée, brouillon, ajout au fil, enregistrement, payload Share, lancement dans le moteur Explorer, restauration au rechargement, import confirmé dans un second navigateur isolé, édition/signalement/masquage/suppression. L'aperçu MapKit et la feuille iOS sont des substituts dans ce test, pas un rendu matériel.

`scripts/community/check-rls.cjs` applique réellement la migration dans PostgreSQL embarqué PGlite, avec fixtures Auth/Storage et rôles/JWT de deux sujets. Il vérifie le refus d'usurpation/édition/suppression, lecture des brouillons, modération/service-role, déclassement après édition, quotas et suppression en cascade. Installation externe de l'outil de test :

```sh
npm install --prefix /tmp/vestige-db-tests @electric-sql/pglite
PGLITE_MODULE=/tmp/vestige-db-tests/node_modules/@electric-sql/pglite node scripts/community/check-rls.cjs
```

Ces outils mainteneur ne sont pas des dépendances de l'application. Aucun module natif ni dépendance Expo n'a été ajouté.

Après mise à jour cumulative sur Windows (Node 24), `npm.cmd install` puis `npx.cmd expo start --tunnel --clear --port 8088`. Ne pas désinstaller Expo Go ni effacer son stockage.

1. Parcours → Communauté : créer un profil avec pseudo et bio, ville facultative.
2. Créer un parcours Lyon : Saint-Jean, Fourvière, théâtre ; réordonner ; sauvegarder en brouillon puis reprendre et ajouter au fil local. Vérifier le badge non vérifié.
3. Ouvrir l'aperçu carte, lancer dans Explorer, tester guidage, Catia, miniatures et joystick. Recharger pour vérifier la reprise ; revenir au GPS réel, sans XP simulé.
4. Partager une copie ; coller le code sur un autre appareil ou dans Importer, confirmer puis lancer. Un lien Expo Go nécessite le même serveur ; aucun réseau public n'est annoncé.
5. Depuis une fiche POI, créer/modifier une découverte ; tester une photo autorisée et son retrait/annulation. Vérifier la feuille de partage iOS manuellement et l'absence de photo/GPS personnel dans le message.
6. Enregistrer, signaler/masquer, consulter la file locale, supprimer. Vérifier les XP, les anciens brouillons, les aventures éditoriales, les marqueurs dorés et George.
7. Refuser les photos/GPS, couper le réseau et vérifier les erreurs sans perte des données. Les fichiers locaux restent consultables ; le moteur ne simule pas un trajet réseau indisponible.

**Validation physique Expo Go iPhone, permissions Photo/MapKit, partage natif, liens entrants et fluidité : en attente.** Les exports/bundles et essais DOM ne remplacent pas ces contrôles.

### Résultats de livraison (11 novembre 2026)

162 tests Node réussis ; TypeScript et lint sans cache réussis. Scénarios communautaires avec deux stockages DOM isolés, GPS simulé/retour au réel et George avec le vrai MP3 réussis. Migration PostgreSQL/RLS réellement exécutée dans PGlite, dont le quota conservé après suppression de contenus. Installation cumulative séparée via `npm install` et contrôle TypeScript réussis. Exports iOS/Android et bundle iOS de développement HTTP 200 réussis. Aucun de ces contrôles ne valide un appareil iPhone physique, GoTrue, le service Storage ou un réseau multi-utilisateur configuré.
