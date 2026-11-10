# Correctif du chargement Catia — validation iPhone en attente

## Symptôme et correction

L'iPhone signale une résolution `React.lazy` vers `undefined`. L'ancien écran utilisait `lazy(() => import("../components/avatars/Catia3DPreview"))`. L'export par défaut existe dans le source et dans le module iOS compilé inspecté ; cela ne prouve pas sa résolution correcte lors de l'exécution sur le téléphone. La cause précise de cette résolution indéfinie n'a pas été reproduite sur appareil dans le Cloud.

Le lecteur est maintenant chargé par un `require` Metro littéral et différé, depuis `Catia3DPreviewLoader`, rendu **à l'intérieur** de `CatiaViewerBoundary`. L'export nommé `Catia3DPreview` est vérifié avant rendu ; l'export par défaut est conservé. Le composant est mémorisé par un initialiseur `useState` et conserve son identité. Il n'existe plus de promesse `import()` / `React.lazy` entre l'écran et le lecteur. Les erreurs d'évaluation native restent interceptables par la frontière d'erreur ; elles ne se produisent pas lors du chargement initial du mode images. Les `Suspense` du Canvas et du chargement GLTF restent en place : ils attendent des ressources, pas l'export d'un composant.

Aucun remplacement de GLB, changement du rig, activation sur carte ou changement de GPS/XP. Le mode images et ses séquences sont conservés. Aucun changement de dépendances nécessaire.

## Compatibilité examinée

- Expo 58.0.23, React 19.3.0, React Native 0.88.1.
- `@react-three/fiber/native` 9.8.2 expose `Canvas`, `useFrame`, `useLoader`, `useThree`. Ses contraintes React `>=19 <19.4` et RN `>=0.78` incluent les versions installées.
- Son implémentation native importe bien **`{ GLView }`** depuis `expo-gl`. Expo GL 58.0.4 exporte ce composant nommé ; cette version et `expo-asset` 58.0.20 correspondent aux modules attendus par le SDK installé.
- Documentation versionnée consultée : https://docs.expo.dev/versions/v58.0.0/sdk/gl-view/ . GLView est inclus dans Expo Go ; le JavaScript ne doit pas être exécuté dans un Chrome distant, les appels GL étant natifs synchrones.
- Une compatibilité déclarée et un export réussi ne valident pas le rendu Expo Go sur l'iPhone.

## Vérifications

Tests de régression : résolutions nommée/par défaut, refus d'un export manquant ou d'une promesse, exécution du vrai composant chargeur compilé avec React, chargement natif différé, remontée des erreurs natives vers son parent. Le moteur natif est substitué dans ces tests ; ils ne testent pas le GPU de l'iPhone. Les autres tests du projet sont conservés.

Contrôles réussis dans le Cloud : **51 tests sur 51**, TypeScript (`npm run typecheck`), lint (`npm run lint`), versions Expo (`expo install --check`) et exports Hermes iOS/Android (`expo export --platform ios --platform android`). Le GLB corrigé conserve son SHA-256 `3efe730d69dbc67cb6ca3fcc33d2767ab976a54686a345927fcf73d4fe8318a9`. Le script PowerShell a été relu, mais ne peut pas être exécuté sur Windows dans cet environnement Linux. Aucun iPhone physique connecté au Cloud : **le plantage signalé reste à confirmer comme corrigé sur appareil**.

## Mise à jour locale

Arrêter Metro avec Ctrl+C, fermer complètement Vestige dans Expo Go, puis mettre à jour les fichiers. Si le dossier est un clone Git sans changements locaux :

```powershell
git switch codex/catia-mobile-preparation
git pull --ff-only origin codex/catia-mobile-preparation
npx.cmd expo start --tunnel --clear
```

Si Git signale des changements locaux, ne pas les effacer ; les sauvegarder/committer avant de poursuivre.

Pour un dossier extrait du ZIP, le script `scripts/windows/update-catia.ps1 -Revision <SHA complet du commit>` télécharge uniquement les six fichiers du correctif et sauvegarde les fichiers existants dans un dossier voisin `Vestige-Catia-backup-...`. Tous les téléchargements sont terminés avant la copie des fichiers. Il ne touche pas aux modèles ni à `node_modules` et ne nécessite pas Git. Lancer ce script depuis le dossier contenant `package.json`. Ne pas l'utiliser pour remplacer une révision plus récente ou un travail local non examiné.

## Validation sur iPhone requise

1. Mettre à jour Expo Go pour SDK 58 et scanner le nouveau QR après `--clear`.
2. Profil → Tester Catia en 3D : vérifier que Catia apparaît, sans l'erreur lazy.
3. Essayer Idle, Walk, Run, pause/reprise, rotation et zoom.
4. Passer en mode images puis revenir en 3D ; sortir/réouvrir l'écran et passer en arrière-plan.
5. Revenir à Explorer et contrôler le GPS, les monuments et la progression.
6. Si échec : conserver le message complet `[Catia 3D]`, le modèle d'iPhone et la version Expo Go. Le mode images reste accessible. Ne pas activer Catia sur la carte avant validation.
