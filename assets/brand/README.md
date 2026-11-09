# Ressources officielles VESTIGE

`vestige-logo.png` est le fichier original fourni par le propriétaire du dépôt (1339 × 1174, RGB). Son contenu n’est pas modifié. Le PNG au nom UUID, ajouté en même temps, est identique et conservé.

Exports configurés dans `app.json` :

- `app-icon-1024.png` : 1024 × 1024, RGB opaque, réduction proportionnelle et marges blanches ; iOS et icône Android standard.
- `android-adaptive-foreground.png` : 1024 × 1024 RGBA, image originale réduite à 640 px de large et centrée ; fond Android blanc. Le blanc de l’original n’a pas été supprimé.
- `favicon-64.png` : 64 × 64 opaque ; remplace la ressource Expo par défaut dans la configuration.
- Splash : utilise directement `vestige-logo.png`, avec `contain`, largeur logique 200 et fond blanc dans les deux modes système.

Pas de recadrage, recoloration, déformation ni redessin. Pas de variante monochrome inventée. Les anciennes ressources Expo restent dans le dépôt mais ne sont plus référencées par ces champs de configuration.

`exports.json` enregistre les dimensions, positions et empreintes SHA-256. Pour régénérer les seuls exports, avec Python 3 et Pillow disponibles :

```bash
python scripts/export_brand_assets.py
```

Les fichiers générés sont versionnés : Python n’est pas requis pour lancer l’application sur Windows avec Expo Go. Expo Go ne permet pas une validation complète de l’icône installée et du splash natif ; tester ceux-ci dans une build native de production.
