# MVP « Vienne antique » — parcours guidé et Vestige Live

## Objectif
Première expérience testable sur iPhone Expo Go : parcourir Vienne à pied avec Catia visible sur la carte, consulter un parcours historique, lancer des narrations historiques sourcées en mode manuel et, après activation explicite, déclencher une narration à l'approche d'une étape. Ne pas annoncer une lecture en arrière-plan tant qu'elle n'est pas validée sur build natif.

## État existant à préserver
- Branche `codex/catia-mobile-preparation`, Catia suit le GPS sur la carte avec sprites dérivés de son modèle 3D; ne pas modifier son identité ni son moteur de déplacement.
- POI dorés désormais visibles; ne pas modifier leur art ou leur clustering.
- Écran `src/app/(tabs)/parcours.tsx` déjà présent, avec `trails` dans `src/data/monuments.ts` et progression via `useGame`.
- Respecter `src/lib/game.ts`, journal/XP existants, permissions GPS, provenance et statuts des POI.
- Voir `docs/design/VESTIGE-LIVE-NARRATION-V1.md` pour séparation éditoriale/communautaire.

## Parcours pilote
Nom : « Vienne antique ». Sélectionner 3 à 5 monuments existants **géolocalisés et vérifiables** à Vienne (candidats possibles à confirmer par recherche documentaire : temple d'Auguste et de Livie, théâtre antique, jardin archéologique de Cybèle, pyramide du cirque romain). Réutiliser les identifiants de monuments existants plutôt que dupliquer les fiches. Ne pas afficher de durée/distance de marche prétendument routée si calculée à vol d'oiseau : préciser « distance indicative » ou intégrer un vrai itinéraire piéton. Vérifier accès public et position avant de recommander un passage.

## UX / écrans
1. Onglet Parcours : carte de présentation, titre, étapes, distance indicative, durée indicative clairement identifiée, bouton « Commencer ».
2. Écran « Visite en cours » : progression étape N/M, carte avec Catia et repères, nom de l'étape, distance, lecture/pause/rejouer/passer, transcription, lien « Sources », bouton terminer.
3. Choix **Manuel** (défaut) / **Automatique** (opt-in), modifiable pendant la visite. Manuel : aucune lecture non sollicitée. Automatique : lecture des étapes éditorialement approuvées lorsque GPS précis et zone atteinte; un seul audio à la fois.
4. État GPS indisponible ou imprécis : ne jamais simuler l'arrivée à un monument; conserver lecture manuelle et consultation de la carte.
5. Sauvegarder progression de visite et préférences séparément du journal XP; ne pas attribuer d'XP par simple lecture audio.

## Narration
- 3 à 5 scripts français de 30 à 60 secondes; voix chaleureuse de **narrateur historique**, pas assistant conversationnel.
- **Pas d'anecdote historique inventée.** Recherche documentaire, sources affichées avec liens, dates et auteur/éditeur si disponibles, puis relecture humaine avant statut `live_editorial_approved`.
- Un script en attente de validation est affichable en brouillon développeur mais **pas** déclenchable automatiquement en production.
- Audio V1 : fichiers pré-générés, versionnés et mis en cache, avec droits de diffusion; ne pas intégrer de clé secrète TTS dans l'application. Si aucun audio approuvé n'est disponible, afficher « Audio en préparation » et transcription provisoire explicitement marquée, sans prétendre que la narration fonctionne.
- Vérifier la compatibilité réelle du module audio avec Expo SDK 58 avant ajout; ne pas introduire de dépendance non testée.

## GPS et logique de déclenchement
- Reprendre `Fix` et `distance` du projet; définir des paramètres testables (par exemple précision <= 50 m, entrée dans rayon 60-90 m, maintien 5 s, sortie > rayon + 30 m, délai de réarmement, exclusion des fixes périmés). Adapter aux contraintes des rues et monuments réels.
- Déclenchement seulement durant session de promenade active; éviter rejouer la même étape à chaque mise à jour GPS; gérer chevauchement de zones, interruptions, changement de mode, pause/arrêt.
- **V1 premier plan** (application ouverte). Géolocalisation et lecture téléphone verrouillé en V2 après vérification des permissions, autonomie batterie et build natif; Expo Go n'est pas une garantie.
- Prévoir tests unitaires déterministes du moteur géospatial et de l'état de session sans GPS réel.

## Livrables Codex
1. UI réellement fonctionnelle, accessible et conforme au thème Vestige.
2. Modèles typés de parcours, étapes et histoires, scripts et sources; séparation stricte `approved` / `draft`.
3. Moteur de progression, lecture et GPS avec tests.
4. Tests `npm run typecheck`, `npm test`, `npm run lint` et vérification CI; expliquer les limites iOS.
5. Commandes PowerShell de mise à jour **cumulative** depuis la version actuellement testée, sans écraser Catia, POI, progression ou données personnelles.
6. Captures ou description précise du parcours et plan de test à pied à Vienne.

## Non-objectifs MVP
Réservations de guides, marketplace payante, voix IA générée en temps réel, commentaires communautaires dans la narration, AR/360, fond iOS non validé, routage piéton inventé.
