# Vestige Live — Narration historique géolocalisée V1

## Décision produit validée (11 novembre 2026)
L'expérience audio doit être celle d'un **narrateur historique**, pas d'un compagnon IA conversationnel. La narration se déclenche pendant une promenade à l'approche d'une rue, d'un monument ou d'une zone, avec consentement explicite. Le contenu narré est **sélectionné et validé éditorialement**. Les contributions communautaires constituent un espace distinct et ne sont jamais injectées automatiquement dans le mode audio, même si elles sont visibles sur une carte communautaire.

## Trois espaces
1. **Vestige Live / La ville te parle** : exploration libre avec déclenchement géolocalisé et narration sourcée.
2. **Parcours historiques** : itinéraires thématiques en autonomie, étapes et audio sourcés, mode GPS.
3. **Communauté** : lieux, photos, souvenirs, anecdotes, propositions de parcours, avec auteur, modération et provenance. Une contribution vérifiée n'est pas automatiquement autorisée dans Vestige Live.

## Séparation des statuts
- `community_published_unverified` : visible dans l'espace communautaire si modérée au titre des règles de publication, badge « non vérifié », jamais dans l'audio.
- `historically_verified` : contenu factuellement contrôlé et sourcé, visible, mais pas encore éligible à la narration automatique.
- `live_editorial_approved` : sélection éditoriale explicite, script audio revu, sources accessibles, peut déclencher Vestige Live.
- `pending` ou `rejected` : jamais visibles publiquement.
- Les POI importés OSM sont des candidats à documenter et ne doivent jamais devenir automatiquement éligibles à Vestige Live.
- La validation éditoriale est par **version de script**, pas seulement par POI. Modifier un script approuvé invalide son approbation tant que la nouvelle version n'est pas revue.

## UX
- Mode promenade activé volontairement. Paramètres : audio automatique oui/non, durée courte/longue, langue, volume, téléchargement hors-ligne, notifications discrètes.
- Détection d'entrée dans une géozone (rue ou POI) avec précision GPS adaptée, vitesse de déplacement, dwell time, hysteresis et cooldown pour éviter les déclenchements répétés; ne pas déclencher sur une position GPS imprécise.
- Si deux lieux proches se chevauchent, prioriser le parcours en cours, puis la proximité et la pertinence; mettre les autres histoires en file d'attente sans les superposer.
- Une histoire écoutée ne se rejoue pas automatiquement à chaque passage; bouton rejouer.
- Respect du silence et des interruptions audio, contrôles lecture/pause/passer, sous-titres/transcription, accessibilité.
- En arrière-plan, les possibilités varient selon iOS/Android, autorisations et restrictions de géolocalisation : ne pas promettre une détection parfaite téléphone verrouillé, tester en conditions réelles.

## Production audio et exactitude
- Pipeline : sujet → recherche documentaire et citations → script court en français → relecture humaine → approbation versionnée → synthèse vocale naturelle (TTS) → fichier audio pré-généré et cache.
- Ne jamais demander à un LLM d'improviser des faits historiques en direct. Une IA peut aider à rédiger un brouillon mais la publication nécessite des sources et une validation humaine.
- Toute affirmation sensible (ex. histoire de la prostitution rue Mercière) exige une vérification explicite avant narration. Pas de généralisation sensationnaliste non étayée.
- Modèle de données suggéré : `audioStories` (id, poiId?, geofenceGeometry, title, script, language, duration, sourceRefs, scriptVersion, editorialApproval, approvedBy, approvedAt, audioAssetUri, contentHash, updatedAt), `listenProgress` privé et `routeStoryOrder`.
- Exposer les sources depuis la fiche audio et afficher une transcription.

## MVP de validation
- 3 à 5 histoires documentées sur une petite zone pilote de Vienne ou Lyon, avec scripts revus, audio pré-généré et déclenchement en mode promenade actif (foreground d'abord).
- Un itinéraire guidé autonome + exploration libre; carte des histoires à proximité; notification puis lecture selon choix utilisateur.
- Aucun contenu communautaire non validé dans le moteur audio.
- Tests sur iPhone Expo Go pour interface; certaines capacités natives de localisation arrière-plan peuvent nécessiter un build de développement, à vérifier selon la stack Expo en place.
- Conserver Catia, carte, progression, statuts POI et fonctionnalités de contribution existantes.

## Décision UX complémentaire — choix du mode (11 novembre 2026)
- **Mode manuel (par défaut)** : aucun déclenchement audio automatique. L'utilisateur sélectionne un POI ou une étape et lance la lecture explicitement.
- **Mode automatique (opt-in)** : l'utilisateur démarre une session de promenade, autorise la localisation appropriée et les narrations se déclenchent à l'entrée de géozones éditorialement approuvées, avec contrôles pause/ignorer/arrêter.
- L'utilisateur peut basculer à tout moment entre les deux modes, sans perdre la progression de visite; un changement vers manuel arrête les nouveaux déclenchements automatiques.
- Réglages séparés pour notifications, lecture automatique et localisation en arrière-plan; le mode automatique ne vaut pas consentement implicite à la localisation permanente.
- Préciser à l'écran les limites iOS/Android, la batterie et les permissions; prévoir un fonctionnement premier plan avant les builds natifs nécessaires pour le fond.
- Pour les parcours guidés, les deux modes restent possibles : étapes déclenchées automatiquement ou ouvertes manuellement.
