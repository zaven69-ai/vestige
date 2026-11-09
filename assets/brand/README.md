# Logo officiel — fichier source attendu

Le logo joint dans la conversation est la référence : épingle, colonne, dégradé cyan/bleu/violet/rose/orange. Son dessin ne doit pas être recréé.

Dans cet environnement, seul le cahier des charges texte est accessible sous forme de fichier ; l’image affichée dans le message n’a pas de chemin ni d’identifiant de téléchargement exploitable. Aucun logo de remplacement n’a été créé.

À réception du fichier original PNG haute définition ou SVG :
1. Conserver une copie inchangée ici.
2. Enregistrer la ressource dans `src/theme/brandAssets.ts`.
3. Produire des exports par redimensionnement proportionnel et ajout de marges uniquement : icône iOS opaque 1024 × 1024 ; icône Android opaque 1024 × 1024 et foreground adaptatif avec zone de sécurité centrale ; splash avec `contain`.
4. Si le fichier source a un fond blanc, le conserver : ne pas supprimer automatiquement ce fond, ne pas changer les couleurs, ne pas déformer ni rogner le symbole.
5. Configurer `app.json` avec ces vrais exports et tester une build native. Les icônes et le splash natifs personnalisés ne sont pas entièrement testables dans Expo Go.

Les icônes système existantes restent inchangées en attendant cet original. Les écrans emploient provisoirement le nom VESTIGE en texte, sans prétendre afficher le logo officiel.
