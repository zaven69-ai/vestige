# Vestige — direction validée : POI immersifs et partage V2

## Décision produit
Le propriétaire valide le visuel conceptuel « Nouveaux POI – Vestige » (10 novembre 2026) : carte d'exploration à l'esprit jeu vidéo, bleu nuit, or, repères lumineux, monuments miniatures, interface premium. Le partage communautaire est central. Cette image est une **référence de direction artistique**, pas une capture de produit fini ni une collection d'assets. Ne pas recopier ses faux chiffres, faux profils, fausses photos, ou ses états éditoriaux non fondés.

## Style des marqueurs
- POI majeurs : silhouette miniature illustrée du monument réel, jamais une reconstruction historique présentée comme authentique. Préférer une vignette spécifique pour 8 lieux phares (temple d'Auguste et de Livie, théâtre antique de Vienne, Saint-Maurice, Saint-André-le-Bas, Fourvière, théâtre de Lugdunum, Saint-Jean, amphithéâtre des Trois Gaules). Autres POI : pictogramme stylisé selon catégorie. Performance : pas de moteur 3D instancié pour chaque POI.
- Éclairage/halo sobre, animé uniquement lors de la sélection et en respectant le réglage d'accessibilité « réduire les animations ».
- Fond carte plus immersif, lisible de jour, GPS et suivi existants préservés. Ne pas remplacer la carte native par une image statique.
- Couleur/certification/progression indépendantes. Vérification : or + bouclier seulement après vérification réelle; communauté turquoise, attente orange, validé vert, import gris-bleu. Visité = anneau/coche distincte. Éviter les statuts trompeurs du concept (« vérifié officiel » sans preuve).
- Pas de surcharge sur les ~778 lieux; clustering et filtres existants à conserver. Légende et contraste accessibles.

## Dimension partage — priorité MVP
1. **Contribuer** : action centrale accessible depuis la carte et chaque fiche.
2. **Ajouter un lieu** : position GPS proposée mais modifiable sur la carte; nom, catégorie, photo facultative, description, source(s) obligatoires pour les affirmations historiques, droits/attribution du média, avertissement de confidentialité sur les photos/localisation.
3. **Enrichir une fiche** : proposer photo, correction, anecdote sourcée, dates; la fiche publique ne change pas avant modération. L'auteur peut consulter l'état de sa proposition.
4. **Modération** : brouillon → soumis → en cours de vérification → accepté/refusé (motif); signalement; protection anti-spam; droits d'accès. Ne pas permettre à l'auteur de s'auto-attribuer « vérifié ».
5. **Provenance et attribution** : afficher contributeur (pseudo public choisi), date, références, licences et historique des versions. Prévoir suppression du compte et traitement des contenus associés.
6. **Partager** : partage natif du lien universel d'une fiche et de son titre; destinataire sans compte doit pouvoir lire la fiche publique. Jamais de position GPS personnelle ni de progression privée dans l'URL. Les liens doivent fonctionner via web ou fallback avant publication.
7. **Social léger** : favoris privés, signalement et profils contributeurs opt-in. Commentaires, réactions et abonnements seulement après infrastructure de modération, signalement, blocage et contrôle des abus.
8. **Récompenses** : XP de contribution uniquement après validation et limites anti-spam; pas de points pour publication non vérifiée. Ne pas mélanger avec XP de découverte existants.

## Parcours UI
- Carte : bouton « + Contribuer » à côté de Quêtes, Collection et Profil; POI sélectionné → aperçu → fiche.
- Fiche : onglets « À propos », « Contributions », « Sources » et action « Partager ». Compteur de contributions seulement s'il existe des données réelles.
- Formulaire : étapes lieu → contenu → sources/photos → aperçu → soumettre; enregistrer brouillon; validation et états d'erreur; accessible sur iPhone.
- Profil : « Mes contributions » avec états, attribution et confidentialité.

## Architecture et sécurité
- Préparer un schéma de données séparant POI public, révisions proposées, médias, sources, comptes, signalements et décisions de modération.
- Exiger authentification pour soumettre, contrôle des accès côté serveur, validation des champs et des URL, limites de taille/type pour les images, rate limiting, vérification de propriété des médias, stockage privé pour contenus en attente, journaux de modération, conformité RGPD.
- Ne jamais exposer de contribution en attente ou rejetée sur la carte publique.
- Ne pas simuler un backend persistant ou une communauté active si non implémentés; rendre les états indisponibles explicites.
- Conserver Catia V1, GPS, progression, XP existants, POI importés et licences OSM.
- Créer sur branche de développement, tests automatisés et vérification Expo Go avant livraison. Livrer par étapes : (A) UI et assets, (B) partage natif de fiches, (C) contribution et backend sécurisé, (D) interactions sociales.
