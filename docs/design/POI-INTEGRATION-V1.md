# Intégration POI V1 — branche Catia

Implémentation de [POI-VISUAL-SYSTEM-V1.md](POI-VISUAL-SYSTEM-V1.md), sans changement de Catia, du GPS, du calcul XP ou du stockage de progression.

## Opérationnel

- Sept catégories typées ; les catégories inconnues restent « Autre patrimoine ».
- 42 dessins originaux SVG + PNG transparents 3× : sept catégories × six statuts. Corps normal 38 px et sélection 45 px ; les marges transparentes accueillent le sceau et l'ombre.
- Les cinq statuts demandés, plus « Éditorial · à contrôler » : ce sixième état permet de conserver l'origine éditoriale des huit fiches initiales sans leur attribuer une vérification inexistante.
- Le sceau de contrôle reste en bas à droite (livre ouvert pour l’éditorial à contrôler, document « ? » pour l’import non vérifié) ; la progression est une coche blanche en haut à gauche, avec halo uniquement pour proximité/sélection. « Complété » n'est qu'un exemple de légende réservé à une future validation de contenu, jamais un état accordé automatiquement.
- Marqueurs natifs mémorisés, `tracksViewChanges=false`, rafraîchissement ponctuel à la fin du chargement PNG et lors d'un changement d'état. Pas de boucle d'animation ou de 3D par POI.
- Culling avec marge pour la perspective et regroupement adaptatif : plafond de 96 vues de marqueurs POI. Aucun membre n'est supprimé d'un groupe. Les groupes peuvent être zoomés puis ouverts dans la liste des lieux voisins.
- Filtres indépendants d'époque, catégorie, origine/contrôle et visites ; remise à zéro globale. Aucun filtre n'écrit dans le carnet ni les XP.
- Bouton « Comprendre les marqueurs », légende avec pictogrammes et libellés. Écran de filtres et légende défilants.
- Prévisualisation sélectionnée : nom, catégorie, contrôle, distance depuis le GPS existant s'il est disponible, lien vers fiche.
- Fiche : statut explicite, provenance et références, champs d'auteur/révisions uniquement s'ils existent, « Fiche à documenter » pour contenu minimal. Les contributions rejetées sont exclues du catalogue public et des accès aux fiches.

## Données réelles et limites

Cette branche contient **35 lieux : huit fiches initiales et 27 fiches générées/importées**. Le catalogue de 791 imports mentionné dans le cahier n'est pas présent ; aucun import supplémentaire ni lieu fictif n'a été ajouté pour atteindre ce chiffre.

Les huit fiches sont `origin=editorial`, `reviewStatus=unreviewed`. Les 27 autres sont `origin=import`, `reviewStatus=unreviewed`. Aucun badge vérifié n'est attribué à la présence d'une URL, d'une description, d'OSM ou de Wikidata. Un futur statut vérifié exige une validation explicite, un identifiant de contrôleur non vide et une date valide ; une validation communautaire conserve l'origine communautaire.

Il n'existe pas de backend communautaire dans cette version. Les états, filtres et champs sont prêts, mais **soumission, modération et profils contributeurs ne sont pas activés ni simulés**. Aucun auteur, événement de vérification ou historique de révision n'est inventé. L'historique de provenance initial reprend uniquement les liens déjà présents.

## Fichiers principaux

- `src/lib/poi.ts` : catégories, statuts, provenance, visibilité et filtres purs.
- `src/components/poi/` : pictogramme, badge, légende et filtres réutilisables.
- `assets/poi/`, `scripts/poi/build-markers.cjs` : artwork original et génération reproductible.
- `HistoricalMarker.tsx`, `PoiClusterMarker.tsx`, `MapOptions.tsx`, `src/app/(tabs)/index.tsx` : intégration carte.
- `src/data/monuments.ts`, `MonumentDetails.tsx`, route de fiche : métadonnées explicites et présentation des sources.
- `src/lib/mapViewport.ts` et `tests/poi.test.ts` : plafond de marqueurs et tests de fiabilité/visibilité.

## Contrôles et previews

Tests couvrant OSM non vérifié, communauté vérifiée, métadonnées de contrôle manquantes, rejet, filtres indépendants, catégorie inconnue, 42 PNG transparents et regroupement de 791 POI synthétiques sans perte. Ces 791 points ne sont utilisés que dans un test.

[Planche HTML](poi-preview.html), [320 px](poi-preview-320.png), [390 px](poi-preview-390.png), [430 px](poi-preview-430.png). Ces planches emploient les vrais assets de production ; ce ne sont pas des captures de la carte native. Contrôle Chromium : images chargées, aucune erreur JS, aucun débordement horizontal aux trois largeurs. Génération : `node scripts/poi/build-markers.cjs`, puis `node scripts/poi/build-preview.cjs`.

TypeScript, lint, 54 tests et exports Expo iOS/Android sont vérifiés dans le Cloud. **Aucun iPhone physique n'est connecté : fluidité, VoiceOver, rendu des marqueurs et interactions dans Expo Go restent à contrôler sur appareil.** Aucun FPS iPhone n'est revendiqué. PowerShell est relu mais non exécuté sous Windows dans ce Cloud Linux.

## Mise à jour Windows sans ZIP complet

Arrêter Metro avec Ctrl+C et fermer Vestige dans Expo Go. Le script `scripts/windows/update-poi.ps1 -Revision <SHA complet du commit>` se lance dans le dossier contenant `package.json`. Il récupère un manifeste de fichiers du commit fixé, télécharge seulement le correctif, vérifie les SHA256 puis sauvegarde les fichiers remplacés dans un dossier voisin `Vestige-POI-backup-...`. Il ne supprime aucun fichier et ne touche ni aux modèles Catia ni aux données sauvegardées.

Il ne réinstalle pas les dépendances : aucune nouvelle dépendance n'a été ajoutée. La configuration Three/Metro du précédent correctif Catia est conservée. Pour un clone Git sans changements locaux : `git switch codex/catia-mobile-preparation`, puis `git pull --ff-only origin codex/catia-mobile-preparation`.

Relancer avec `npx.cmd expo start --tunnel --clear`, puis scanner le nouveau QR. Compte Expo gratuit nécessaire pour le tunnel SDK 58, comme précédemment.

## Parcours de test iPhone

1. Explorer : examiner le temple et une fiche importée. Aucun ne doit être « vérifié » par défaut.
2. Ouvrir « Comprendre les marqueurs » et distinguer sceau de contrôle / coche de découverte.
3. Filtrer catégories, périodes, origine/contrôle et visites séparément, puis tout réinitialiser ; le carnet et les XP doivent rester identiques.
4. Choisir seulement « Communauté · vérifié » : aucun résultat dans ce catalogue ; aucun faux contributeur.
5. Zoomer/dézoomer, ouvrir un groupe puis une fiche. Contrôler labels, sources, photo et fermeture.
6. Tester le retour à la carte, le suivi GPS existant et l'aperçu Catia sans les modifier. Ne pas activer Catia sur la carte.
