# Contrat de publication communautaire — préparation, non déployé

Ce document décrit le backend restant à construire. Aucune des tables, API, protections serveur ou décisions ci-dessous n'est présentée comme opérationnelle. La V2 actuelle stocke uniquement des brouillons privés sur l'appareil et n'a aucun appel réseau de soumission.

## Modèle séparé

| Objet | Champs essentiels | Visibilité / autorité |
| --- | --- | --- |
| PublicPoiVersion | poiId stable, numéro de version, contenu, catégories, provenance, références, médias publiables, reviewedBy/reviewedAt | lecture publique ; écriture transactionnelle uniquement par la publication serveur |
| Account | id d'authentification, pseudo public opt-in, paramètres de confidentialité, état de suppression/blocage | privé par défaut ; pseudo publié seulement sur consentement explicite |
| ProposedRevision | id, ownerAccountId, poiId nullable pour nouveau lieu, type, champs proposés, sources, médias privés, état, timestamps serveur | auteur et modérateurs seulement ; aucun mélange avec la carte publique |
| Media | ownerAccountId, objectKey privé, type/taille vérifiés, droits/attribution/licence, état de revue, dérivés nettoyés | stockage privé en attente ; URL publique seulement après acceptation |
| ModerationDecision | revisionId, acteur modérateur, décision, motif, version ciblée, timestamp serveur | journal append-only ; auteur voit l'état et le motif, pas les données privées d'autres auteurs |
| Report | reporterAccountId, poiId/revisionId, motif, état de traitement | auteur et modérateurs ; jamais exposé dans un compteur public simulé |
| ContributionReward | revisionId, accountId, montant plafonné, clé d'idempotence | attribué côté serveur après acceptation ; indépendant des XP de découverte existants |

## États et politique de publication

`draft → submitted → reviewing → accepted | rejected`. Le client actuel ne peut enregistrer que `draft`. Les transitions ultérieures exigent serveur, authentification et contrôle des rôles. L'auteur ne peut définir ni statut « vérifié », ni contrôleur, ni XP, ni version publique. Une acceptation conserve l'origine communautaire et la chaîne de provenance ; elle ne transforme pas une importation OSM en validation historique automatique.

La lecture publique doit porter uniquement sur PublicPoiVersion publiée. Soumis, en vérification et refusé restent privés. Les compteurs, auteurs et versions affichés proviennent de vraies données publiées. Le code de visibilité V2 exclut déjà `community + pending` et les éléments rejetés ; ce filtre client ne remplace pas une politique d'accès serveur.

## Exigences avant ouverture

- Authentification réelle et contrôle d'accès serveur pour chaque objet ; tests d'accès croisé entre comptes et élévation de privilèges.
- Validation serveur du nom, position, catégorie, contenu, date et références ; ignorer tous les champs client de contrôle/récompense. Les limites locales ne sont qu'une aide à la saisie.
- Liens HTTPS validés ; tout futur aperçu serveur doit bloquer IP privées, redirections internes, SSRF et réponses surdimensionnées.
- Taille/type/dimensions réels des images vérifiés côté serveur ; suppression des métadonnées sensibles, contrôle des droits, traitement des contenus illicites et stockage privé des originaux en attente. La simple checkbox locale ne prouve pas la propriété.
- Quotas et rate limiting par compte/réseau, détection des doublons, journal de modération, capacité de signalement et blocage avant commentaires/réactions/abonnements.
- Publication atomique et versionnée, protection des modifications concurrentes, audit et retour arrière ; récompense idempotente plafonnée après validation seulement.
- Pages publiques lisibles sans compte, domaine HTTPS réel, liens universels iOS/Android et fallback web testé. Aucun lien `exp://` ou schéma privé dans le partage public.
- Politique de conservation et parcours de suppression du compte/contenus, traitement des médias, crédits et décisions de modération à définir et faire valider avant ouverture. Ne pas annoncer une conformité RGPD accomplie sur la seule base de ce document.

Aucun fournisseur payant, service d'authentification ou hébergement n'a été souscrit ni activé. Les commentaires, réactions et abonnements restent hors de cette livraison.
