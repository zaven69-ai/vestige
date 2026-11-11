# Vienne antique — navigation piétonne V1

## Ce qui est intégré

Le parcours réutilise `react-native-maps` 1.29.11, `expo-location` SDK 58, le GPS partagé, les marqueurs dorés et `PlayerMarker`/Catia existants. Aucun nouveau SDK natif, token payant, moteur GL ou modèle de personnage. Navigation en premier plan dans la visite.

Parcours → Vienne antique → **Rejoindre le départ** : démarre/reprend la visite, demande le GPS si nécessaire et calcule depuis le fix réel jusqu'au repère d'approche de l'étape courante. En cas de reprise à l'étape 2/3, le bouton indique « Rejoindre l’étape en cours ». « Commencer » reste disponible pour consulter sans activer le routage.

Le calcul appelle le service public HTTPS Valhalla/FOSSGIS avec `costing: pedestrian`, langue `fr-FR` et unités kilomètres. La réponse fournit une géométrie polyline6, distance, durée et instructions. Le parseur vérifie les unités, le statut, le mode piéton de chaque manœuvre, les indices de géométrie et la proximité des extrémités demandées. Une erreur ne produit jamais de ligne droite de remplacement ni de distance de navigation inventée.

La carte de visite affiche une ligne dorée continue sur fond bleu nuit, avec un contour sombre, derrière les POI. Aucun symbole fléché de liaison n'est ajouté. La branche inspectée n'avait pas de composant de flèches entre monuments dans VisitMap : l'ancienne carte sans routage est remplacée par la géométrie du moteur. Les flèches textuelles de boutons sans rapport dans Explorer ne sont pas modifiées.

Catia suit toujours le GPS réel avec le moteur/sprites existants. Le mode caméra suit le joueur et son cap ; déplacer/pincer/tourner la carte ou « Voir les étapes / tout l'itinéraire » passe en carte libre. **Suivre Catia** réactive le suivi. Sans GPS récent, Catia reste un aperçu explicitement identifié, sans position réelle inventée.

Les instructions du moteur apparaissent dans un bandeau sur la carte et dans le panneau de guidage. La distance restante est interpolée sur la géométrie réelle et ramenée à la distance du moteur ; la durée restante est une estimation proportionnelle à son estimation de temps. Ce n'est pas une prévision de trafic ni une mesure de la vitesse personnelle. La carte de présentation du pilote n'annonce plus un temps de marche à vol d'oiseau.

## Recalcul, arrivée et étape suivante

- Fix de navigation : âge <= 15 s et précision <= 50 m.
- Sortie de trajet : écart supérieur à max(45 m, 1,5 × précision GPS), maintenu au moins 6 s avec des fixes distincts ; recalcul automatique au plus une fois toutes les 30 s. Les anciennes instructions sont masquées tant que le joueur est hors trajet.
- Annulation et identité des demandes : changement de destination, arrêt ou passage en arrière-plan annulent le calcul ; une réponse tardive de l'ancien trajet ne peut pas remplacer le nouveau. Délai de calcul maximum de 15 s, message et bouton de reprise en cas d'échec.
- Arrivée : <= 30 m du repère, précision <= 25 m, maintien >= 3 s et plusieurs fixes couvrant ce maintien. Avec le GPS existant échantillonné environ toutes les 5 s, la confirmation arrive normalement à une mise à jour GPS suivante, pas immédiatement.
- Le bouton **Ouvrir la narration** présente les sources et le texte de l'étape. Le lecteur et la sélection Manuel/Automatique existants restent responsables du son. Le déclenchement audio automatique garde son seuil existant d'approche (75 m/5 s) et sa validation éditoriale. Aucun brouillon ne devient approuvé par arrivée ou lecture.
- **Étape consultée · guider vers la suivante** avance la progression privée de visite, sans XP ; le nouvel itinéraire repart du GPS courant vers l'étape suivante. Le bouton devient « terminer le parcours » à la dernière étape. La fin réelle d'une narration approuvée continue aussi d'avancer via le moteur Live existant.

## Réseau, distance et confidentialité

Le calcul n'envoie départ/destination qu'après activation du guidage ; la présentation le précise. Aucun historique de positions ou nouvel outil analytique n'est enregistré. Les nouvelles demandes sont faites au changement d'étape, à un écart confirmé ou à un recalcul manuel, pas à chaque fix.

Le service public est gratuit et sans clé pour ce MVP, mais n'offre pas de garantie de disponibilité. Une diffusion à grande échelle nécessitera un service dimensionné/auto-hébergé et le respect des règles du fournisseur. Références : https://valhalla.openstreetmap.de/ ; https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/ ; https://docs.expo.dev/versions/v58.0.0/sdk/location/ .

Au-delà de 50 km d'éloignement direct, le client ne demande pas de grand trajet piéton au serveur public : il explique la limite et propose Plans/Maps en voiture. Dans la plage autorisée, le moteur peut lui-même refuser un itinéraire : message explicite, aucune route fictive. Les liens de navigation automobile ne fournissent pas une fausse origine ; le téléphone détermine sa propre position.

En cas de refus GPS, l'écran reste consultable et propose l'autorisation. Sans réseau, l'échec est affiché ; si un trajet antérieur vers la même destination existe en mémoire, il reste visible comme dernier calcul, mais les instructions ne prétendent pas être actualisées. Changer d'étape masque immédiatement l'ancien trajet. Il n'existe pas de routage hors ligne, d'historique persistant des itinéraires ou de guidage écran verrouillé dans cette V1.

Les chemins sont ceux du réseau OpenStreetMap accessible au modèle piéton. Ce n'est pas une garantie de travaux absents, d'accès actuel ou d'accessibilité fauteuil ; respecter les accès et horaires des sites. Catia, ses assets/animations, le clustering, les fiches, le journal XP et les contributions sont inchangés.

## Vérifications reproductibles

`tests/navigation.test.ts` utilise des réponses réelles enregistrées et teste le protocole, les manœuvres, la géométrie, les unités, la progression, l'écart, le cooldown, les fixes invalides, l'arrivée, le réseau, l'annulation et les liens natifs. La CI reste déterministe et n'appelle pas le serveur public.

`node --experimental-strip-types scripts/navigation/probe-valhalla.mjs` est une vérification réseau volontaire sur trois points de test publics, pas sur un GPS utilisateur. `--fixtures` actualise les captures brutes. Les appels sont espacés ; résultats dans `valhalla-live-check.json`.

Calculs réels vérifiés le 11 novembre 2026 :

| Trajet de test | Distance moteur | Durée moteur | Géométrie |
| --- | ---: | ---: | ---: |
| Centre de Lyon → temple | 28 226 m | 21 287,892 s | 1 123 points |
| Temple → Cybèle | 173 m | 129,245 s | 16 points |
| Cybèle → théâtre | 352 m | 295,983 s | 35 points |

Ces valeurs sont celles des réponses enregistrées à la date du contrôle, pas des constantes utilisées par l'application. Les instructions en français correspondent aux rues et chemins retournés. La formule d'ETA restante est indiquée dans l'interface. Un trajet futur peut changer avec les données du service.

## Plan d'essai iPhone / Expo Go

1. Mettre à jour, relancer Metro, ouvrir Parcours → Vienne antique → Rejoindre le départ. Avec GPS refusé, confirmer l'état d'attente et l'aperçu Catia ; aucun tracé ni temps fictif.
2. Autoriser le GPS et attendre une précision <= 50 m. Confirmer le trait continu doré suivant les rues, les distances/durées et le bandeau d'instructions. Depuis loin, essayer le bouton Plans/Maps en voiture ; au-delà de 50 km, contrôler la limite et l'absence de faux tracé.
3. Déplacer/pincer/tourner la carte : le suivi s'arrête. Toucher Suivre Catia : la caméra revient au joueur entier et animé. Ouvrir une fiche POI et vérifier son fonctionnement.
4. À Vienne, marcher sur le trajet. S'écarter suffisamment, attendre plusieurs mesures et le délai de réarmement ; confirmer le recalcul unique. Passer en mode avion durant un calcul : erreur et reprise manuelle, sans ligne de remplacement. Revenir au réseau et recalculer.
5. Près du temple, attendre la confirmation GPS, ouvrir la narration. Les fichiers audio sont toujours en préparation tant que les trois scripts n'ont pas reçu de relecture/enregistrements autorisés ; ne pas confondre transcription et son disponible.
6. Étape consultée → Cybèle : vérifier une nouvelle géométrie depuis le GPS actuel. Répéter vers le théâtre. Aucune ligne de simple liaison entre les trois monuments. Respecter ses horaires et accès.
7. Vérifier les XP/carnet avant/après : aucune récompense par simple guidage ou texte. Pause, arrière-plan et fermeture interrompent le guidage ; aucune validation iPhone physique n'est revendiquée avant cet essai.

Les calculs réseau et exports ne prouvent pas le rendu UIKit, la précision GPS en rue ou la fluidité sur iPhone. La projection géométrique est simple, sans map-matching avancé. La narration historique reste dans son état d'approbation antérieur, « Audio en préparation ».

## Résultats de livraison

- TypeScript, ESLint et 118 tests : réussis, dont 14 nouveaux tests de navigation.
- Appels réels au service : trois trajets validés, avec géométrie, temps, distances et instructions en français ; captures JSON et rapport versionnés.
- Mise à jour cumulative sur la copie de test d'un ancien projet : `npm install`, typage et 118 tests réussis.
- Exports Hermes iOS et Android de cette copie mise à jour : réussis. Aucune nouvelle bibliothèque native n'est requise pour cette fonctionnalité.
- Aucun fichier d'assets Catia, de moteur de déplacement, d'art/clustering POI, de journal XP ou de contenu historique n'est modifié.
- CI à vérifier sur le commit publié ; aucun test iPhone physique ni exécution du script sous Windows n'est revendiqué ici.
