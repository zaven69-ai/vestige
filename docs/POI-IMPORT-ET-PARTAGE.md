# Import de POI et partage (version initiale)

La branche de travail contient un importeur OpenStreetMap pour **Vienne et Lyon**. Les objectifs de 300 + 700 sont des plafonds, pas des résultats garantis.

## Import

Depuis la racine du projet, lancer `node scripts/import-pois.mjs`. Le script interroge Overpass, vérifie noms et coordonnées, ignore les sites explicitement privés, limite à 300 POI à Vienne et 700 à Lyon et remplace `src/data/imported-pois.json`. L'import est reproductible. Il ne fabrique ni anecdotes, ni images, ni datations historiques.

Les POI importés sont **candidats à valider** (`reviewStatus: pending`) : contrôler leur intérêt, les doublons sémantiques, la localisation accessible, la période historique et les sources avant diffusion publique. Les POI existants restent conservés. Les images manquantes utilisent une vignette de marque plutôt qu'une photo trompeuse.

Données : © contributeurs OpenStreetMap, licence ODbL 1.0, https://www.openstreetmap.org/copyright. Avant publication, prévoir les obligations d'attribution ODbL et la validation éditoriale. Une source OSM seule ne vaut pas une fiche historique vérifiée.

## Partage

Le bouton « Partager ce lieu » ouvre le partage natif iOS/Android avec le nom, la ville et le lien public de la source. Aucune position GPS du joueur ni carnet privé n'est envoyé. Les profils publics et le fil social nécessitent encore une authentification et un backend : **ils ne sont pas implémentés**.

## Performances

La carte ne doit pas afficher des milliers de marqueurs simultanément. Avant de dépasser 1 000 lieux, ajouter filtrage par fenêtre géographique et clustering; tester sur iPhone/Android.
