# Vestige Live — livraison du pilote Vienne antique (#6)

## Périmètre réellement livré

Parcours → carte « Vienne antique » → Commencer → écran « Visite en cours ». Trois étapes réutilisent `auguste`, `cybele`, `theatre-vienne`. Distance et durée de marche annoncées comme indicatives, à vol d’oiseau, hors détours et visites. Aucun routage piéton inventé.

L’écran présente le numéro d’étape, la distance au repère officiel d’approche, une carte native avec les POI dorés et le moteur Catia existants, les commandes de visite et audio, la transcription et les liens documentaires. Sans GPS récent, Catia est un aperçu explicitement identifié, sans position fictive ni arrivée simulée. Le bouton « Voir Catia au GPS » recentre la carte sur le fix réel.

**Audio en préparation** : les trois scripts sont des brouillons, aucun fichier audio historique n’est fourni ou approuvé. Les commandes de narration sont donc désactivées ; le mode automatique peut être activé mais ne peut lire aucun de ces brouillons. En développement Expo Go, les transcriptions provisoires sont consultables ; les textes non approuvés sont masqués en production. Ne pas présenter le pilote comme une expérience audio audible complète.

Le cahier exige : « relecture humaine avant statut `live_editorial_approved` ». Le dossier [Scripts V1](VIENNE-ANTIQUE-SCRIPTS-V1.md) contient les textes exacts, leurs sources, hash et cases de relecture encore non cochées. #6 reste ouverte tant que relecture, enregistrements autorisés et tests iPhone ne sont pas terminés.

## Architecture

- `src/data/live/stories.json` : trois scripts français originaux sourcés, versions, hash, approbation nulle.
- `src/data/live/vienneAntique.ts` : parcours et accès documentés, repères de fiches officielles, sans modification des données POI.
- `src/lib/live/eligibility.ts` : origine éditoriale obligatoire, relecture explicite, texte/version/hash exacts, sources HTTPS, fichier enregistré et droits renseignés. Être importé ou historiquement vérifié ne suffit jamais.
- `geofence.ts` : précision <= 50 m, fix <= 15 s, vitesse <= 4 m/s si disponible, entrée à 75 m, maintien 5 s avec au moins deux fixes couvrant ce maintien, sortie au-delà de 105 m et délai de 60 s. Les ruptures de précision ou un mode inactif remettent le maintien à zéro. Une même version ne se déclenche qu’une fois par session.
- `playback.ts` et `LiveProvider.tsx` : uniquement l’étape courante du parcours, un seul lecteur, verrou immédiat contre deux demandes concurrentes, callbacks protégés par identifiant de lecture contre les fins d’anciens lecteurs. Pas de voix communautaire injectée ni de lecture superposée. L’étape suivante devient courante à la fin réelle d’un audio ; les étapes peuvent aussi être consultées ou passées manuellement.
- `session.ts` : progression (`consulted`, `skipped`, `listened`), session et préférences privées dans des clés AsyncStorage nouvelles. Aucun appel d’attribution XP. Préférence de mode mémorisée, mais mode actif toujours manuel au chargement/recommencement ; l’automatique exige un nouvel opt-in.
- `NativeNarration.tsx` : véritable adaptateur `expo-audio` 58.0.11, module documenté inclus dans Expo Go SDK 58, installé par `expo install`. Lecteur monté uniquement pour un asset approuvé, cache avec `downloadFirst`, volume, pause/reprise, fin et erreurs. Le module n’a pas été testé sur un iPhone physique ici ; ses appels sont contrôlés avec un port natif simulé dans les tests.
- `scripts/live/register-audio.cjs` : vérifie les versions, approbations et droits puis génère les imports statiques de fichiers locaux. Le registre audio est actuellement vide, volontairement.

## Premier plan et données

Quitter la visite, ouvrir une fiche ou les sources externes, verrouiller ou mettre l’application en arrière-plan suspend la lecture. Revenir ne reprend pas le son automatiquement. Aucun mode de localisation/audio en arrière-plan, micro, clé TTS ou service payant n’est activé. Les commandes « Écoutée » ne sont jamais simulées par simple consultation du texte.

Catia, ses modèles/sprites et son déplacement sont réutilisés sans modification. Le clustering et les illustrations POI restent intacts. `GameProvider`, les contrôles de découverte et les écritures XP/contributions ne changent pas. Une sauvegarde Live illisible est signalée et conservée sans remise à zéro du journal.

## Plan de test Expo Go / à pied

1. Mettre à jour le projet, lancer Metro, ouvrir Parcours → Vienne antique. Confirmer les trois étapes et les mentions « indicatif » / « Audio en préparation ».
2. Commencer : mode Manuel par défaut, progression 1/3. Sans GPS, aperçu Catia et aucune arrivée annoncée ; texte/sources accessibles, lecture audio désactivée.
3. Autoriser le GPS : vérifier la distance au repère, « Voir Catia au GPS » et l’orientation en marchant. Vérifier les POI dorés et l’ouverture des fiches sans perte de progression.
4. Choisir Automatique : l’alerte exige une activation explicite. Avec les brouillons livrés, approcher chaque repère ne doit produire aucun son, aucune fausse écoute et aucun XP. Un GPS imprécis/périmé ne valide pas d’arrivée.
5. « Étape consultée », « Passer », pause/reprise et terminer : contrôler les compteurs séparés, relancer l’application et reprendre la visite enregistrée en mode Manuel. Vérifier le carnet/XP avant et après.
6. Après relecture et intégration de vrais enregistrements : essai près du temple, puis Cybèle et du théâtre depuis les voies autorisées. Dépasser 5 s en zone avec GPS précis ; une seule lecture ; sortir/revenir sans répétition ; tester mode Manuel, pause, rejouer, passer, interruption par appel, casque débranché, fiche ouverte et verrouillage. Pas de reprise automatique au retour.
7. Le théâtre peut être fermé ou payant. Consulter les sources actualisées et ne pas entrer sans autorisation. Les repères cartographiques et le passage à pied restent à confirmer sur le terrain ; aucune garantie de cheminement accessible n’est fournie.

Le navigateur ne peut pas valider UIKit, le GPS réel ou le son d’Expo Go. Les exports mobiles et les tests simulés ne remplacent pas cet essai physique. Le script PowerShell est préparé pour Windows mais exécuté/validé uniquement par son équivalent de copie cumulative sous Linux dans cet environnement.

## Résultats des contrôles de cette livraison

- `npm run typecheck`, `npm run lint`, `npm run live:validate`, `npm test` : réussis, 104 tests dont 16 nouveaux tests Live.
- `expo install --check` : dépendances compatibles SDK 58, dont expo-audio 58.0.11.
- Paquet cumulatif appliqué à la copie de test d'un ancien projet : installation des dépendances, validation du catalogue, typage et 104 tests réussis. Exports Hermes iOS et Android réussis.
- Le catalogue contient exactement 3 scripts `draft`, 0 approbation humaine et 0 enregistrement approuvé. Cette absence n'est pas masquée dans l'interface.
- L'adaptateur du véritable composant Expo Audio est testé avec le port natif simulé : attente de chargement, pause, interruption, fin idempotente et erreur. Aucun son historique ni essai matériel iPhone n'est revendiqué.
- La CI existante est enrichie de `live:validate` et doit être contrôlée sur le commit publié. Son résultat ne constitue pas une validation du GPS et du rendu sur appareil.
