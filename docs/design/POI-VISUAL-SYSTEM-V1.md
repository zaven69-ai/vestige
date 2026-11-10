# Vestige — système visuel des POI V1

## Objectif
Une carte d'exploration immersive et une encyclopédie collaborative, lisibles sur iPhone. Les visuels de concept ne sont pas des assets de production : les marqueurs doivent être redessinés en vecteurs/PNG transparents, cohérents et utilisables à 24–48 px.

## Trois dimensions indépendantes (ne jamais les confondre)
1. **Catégorie** : représentation centrale du lieu (temple, musée, château, édifice religieux, patrimoine industriel, nature, autre). Les 791 POI importés ne sont pas tous classés : prévoir « autre ».
2. **Origine / niveau de contrôle** : liseré et petit sceau, toujours lisibles sans la couleur.
   - `editorial_verified` : doré + bouclier bleu coché. Uniquement après contrôle éditorial et sources vérifiées.
   - `community_unreviewed` : turquoise + symbole utilisateurs. Contribution publiée mais non contrôlée.
   - `community_pending` : ambre + horloge. Contribution en attente de modération.
   - `community_verified` : vert + symbole utilisateurs et coche. Vérifiée, origine communautaire conservée.
   - `imported_unreviewed` : gris-bleu + symbole document « ? ». **Par défaut pour les importations OSM/Wikidata non vérifiées individuellement.** Une source OSM ne constitue pas une validation historique.
3. **Progression du joueur** : découvert / à portée / non découvert / complété. Petite coche de progression distincte du sceau de fiabilité, ou anneau extérieur ; ne jamais afficher une coche de progression à la place d'une coche éditoriale.

## Contraintes de données
- Ne pas déduire `editorial_verified` de la simple présence de `source`, `sourceRefs`, d'un identifiant OSM, ni d'une description.
- Les 8 fiches historiques éditoriales existantes peuvent être candidates à la vérification mais doivent avoir un champ de validation explicite avant le badge « vérifié ».
- Les POI importés automatiquement doivent rester `imported_unreviewed` tant qu'une vérification individuelle n'a pas été faite.
- Ajouter des champs typés, par exemple `origin: "editorial" | "community" | "import"`, `reviewStatus: "unreviewed" | "pending" | "verified" | "rejected"`, `verifiedAt?`, `verifiedBy?`, `contributorId?`. Ne pas inventer des auteurs.
- Une contribution rejetée ne doit pas être affichée publiquement.
- En V1, ne pas simuler la soumission de contributions, la modération ni les profils utilisateurs tant que le backend n'existe pas.

## Carte
- Icônes compactes, ombre discrète, contraste AA, halo uniquement pour la sélection ou la proximité. Taille normale 34–40 px, sélection 44–48 px.
- Prioriser la fluidité : clustering, viewport culling, maximum de marqueurs raisonnable, rendu stable iOS/Android, pas de composants 3D par POI.
- Ne pas encombrer la carte avec des textes permanents. Légende accessible depuis un bouton « Comprendre les marqueurs ».
- Filtres indépendants : époque, catégorie, origine/fiabilité, visités/non visités. Aucun filtre ne doit effacer la progression enregistrée.
- Marqueur sélectionné : carte de prévisualisation avec nom, catégorie, statut de vérification, distance GPS seulement si autorisée, lien vers fiche.

## Fiche encyclopédique
- En-tête : nom, catégorie, ville, période, statut de contrôle explicite.
- Sections : histoire (avec sources citées), frise chronologique (si documentée), médias avec attribution/licence, contributions et historique des révisions (seulement si les données existent), proximité et XP.
- Distinguer « Source disponible » de « Information vérifiée ».
- Pour une fiche importée incomplète : « Fiche à documenter », pas d'invention d'histoire ni de date.
- Conserver un historique de provenance, même après validation communautaire.

## Palette indicative
- Fond nuit : #081626 ; or éditorial : #E6AD4F ; turquoise communauté : #26CAD8 ; ambre attente : #F29D38 ; vert vérifié communauté : #7BCB56 ; gris-bleu import : #8596A9.
- Utiliser aussi pictogrammes, labels et textes pour l'accessibilité, jamais la couleur seule.

## Livrables Codex
1. Composants POI typés et testés, réutilisables sur la carte et dans la fiche.
2. Légende + filtres avec libellés français.
3. Tests de correspondance des statuts, y compris « OSM importé non vérifié » et « communauté vérifiée ».
4. Previews / captures sur plusieurs tailles d'écran.
5. Tests `npm run typecheck`, `npm run lint`, `npm test` et validation Expo Go.
6. Aucun changement de Catia, du GPS, des XP ou de la progression, aucune fusion en main sans validation.
