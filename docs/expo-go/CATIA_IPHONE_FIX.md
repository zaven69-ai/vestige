# Catia : cause identifiée dans le graphe Metro — validation iPhone en attente

## Pourquoi les deux correctifs précédents échouaient

Le fichier TSX exporte un composant valide. Le problème précède son rendu :

1. `Catia3DPreview` importe `@react-three/fiber/native` 9.8.2.
2. Son point d'entrée natif CommonJS fait `require("three")`.
3. Les conditions de résolution Metro sélectionnent `three/build/three.cjs`, version 0.187.0. Le GLTFLoader et SkeletonUtils sélectionnent, eux, la version ESM.
4. La ligne 12 du vrai fichier `three.cjs` appelle **`process.emitWarning(...)`**, API Node absente de React Native. L'évaluation de l'import échoue.
5. `metro-runtime/src/polyfills/require.js`, dans `guardedLoadModule`, transmet l'exception à `global.ErrorUtils.reportFatalError` puis retourne `undefined`. Il efface aussi les exports du module qui a échoué.
6. `React.lazy` reçoit donc un module sans composant. Le chargeur ajouté dans `c53ef5d` recevait le même `undefined`, puis lançait son erreur générique. Il ne corrigeait pas l'import de Three et masquait la cause par un second message.

Ce mécanisme est **reproduit avec les vraies factories du bundle iOS et le vrai chargeur Metro**, dans une VM JavaScript sans `process.emitWarning`. Les frontières natives RN/Expo, l'asset et l'UI/capteurs sont substitués ; React, Three, GLTFLoader, R3F, le JS d'Expo GL et le module Catia viennent du vrai bundle. Cela n'est pas une mesure directe des exports sur l'iPhone ni un test du GPU natif.

Résultat avant : `requireType: "undefined"`, aucune clé, erreur fatale `process.emitWarning is not a function`, deux identifiants de modules Three.

Résultat après : `requireType: "object"`, clés `["default"]`, `defaultType: "function"`, aucune erreur fatale, un seul identifiant Three, aucun `three.cjs` dans le graphe. Rapport : [catia-module-resolution.json](catia-module-resolution.json).

## Correction

`metro.config.js` résout **toute demande exacte de `three` sur iOS/Android vers `three/build/three.module.js`**, qu'elle provienne d'un import ESM ou d'un require CommonJS. Il utilise le chemin du package installé, sans chemin absolu propre au Cloud. Les autres modules et la résolution web sont délégués au résolveur Metro d'origine. L'extension asset `glb` est conservée.

Cela évite le point d'entrée Node et garantit une seule instance de Three : les patchs FileLoader/TextureLoader de R3F natif s'appliquent aussi au GLTFLoader. Il n'y a aucun faux `process.emitWarning`, aucune désactivation de l'erreur et aucun alias vers un Canvas web.

Le chargeur personnalisé, son helper et leurs tests devenus inutiles sont retirés. L'écran retrouve `lazy(() => import(...))` avec un **export default fonction**, sous `CatiaViewerBoundary` et `Suspense`. Les Suspense internes du Canvas et du modèle restent présents. Les éléments `View/Text/Pressable` restent à l'extérieur du Canvas ; les éléments Three restent à l'intérieur. Le mode images reste indépendant.

Le GLB corrigé, sa texture, son squelette, Idle/Walk/Run, le joueur de la carte et le GPS/XP ne changent pas. Aucun changement de dépendances.

## Compatibilité et preuves

Expo 58.0.23, React 19.3.0, RN 0.88.1, R3F 9.8.2 et expo-gl 58.0.4. Les peers R3F incluent ces versions de React/RN. Expo GL exporte bien `GLView`, import nommé utilisé par R3F natif, et correspond à `expo/bundledNativeModules.json`. Cette compatibilité déclarée n'empêche pas le bug d'entrée Three décrit ci-dessus.

Documentation versionnée consultée : https://docs.expo.dev/versions/v58.0.0/sdk/gl-view/ . Expo GL est inclus dans Expo Go ; ne pas exécuter le JavaScript dans un Chrome distant, les appels GL étant natifs synchrones.

Contrôles déjà réussis : **49 tests sur 49**, TypeScript, lint, `expo install --check` et exports Hermes iOS/Android. Les graphes iOS et Android exposent le default Catia, `Canvas`, `useFrame`, `useLoader`, `useThree` et `GLView` comme fonctions, avec une seule cible Three ESM et aucune erreur fatale dans le contrôle JavaScript.

Tests de régression : vraie source Three CJS + vrai chargeur Metro pour reproduire le retour undefined et l'erreur d'origine ; résolution ESM native et délégation des autres modules. Le script `scripts/avatars/catia/inspect-native-module.cjs` vérifie aussi un bundle de développement réel.

Pour reproduire ce dernier contrôle après `npx expo start --localhost --port 8093 --clear` :

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:8093/src/app/catia.bundle?platform=ios&dev=true&minify=false&runModule=false&modulesOnly=true' -OutFile "$env:TEMP\catia-ios.bundle"
node scripts/avatars/catia/inspect-native-module.cjs "$env:TEMP\catia-ios.bundle"
```

Le script doit trouver un export default fonction, une seule instance Three, aucun point d'entrée Three CJS et aucune erreur fatale. Ce contrôle ne monte pas de GLView sur un appareil.

## Mise à jour Windows

Arrêter Metro avec Ctrl+C. **Le serveur doit redémarrer**, car sa configuration change : un simple rechargement Fast Refresh ne suffit pas. Fermer Vestige dans Expo Go.

Pour un clone Git sans modifications locales :

```powershell
git switch codex/catia-mobile-preparation
git pull --ff-only origin codex/catia-mobile-preparation
npx.cmd expo start --tunnel --clear
```

Pour le dossier extrait du ZIP, lancer `scripts/windows/update-catia.ps1 -Revision <SHA complet du commit>` depuis le dossier contenant `package.json`. Il télécharge uniquement huit fichiers, sauvegarde les fichiers remplacés et les trois anciens fichiers de contournement dans un dossier voisin `Vestige-Catia-backup-...`, puis retire ces trois fichiers inutilisés. Les téléchargements et sauvegardes précèdent les modifications. Aucun modèle ni dépendance n'est supprimé. Le script ne nécessite pas Git ; PowerShell n'est pas disponible dans le Cloud pour le tester sous Windows.

## Validation physique encore nécessaire

1. Mettre à jour Expo Go pour SDK 58 et scanner le QR du serveur redémarré.
2. Profil → Tester Catia en 3D : vérifier que le modèle apparaît.
3. Essayer Idle, Walk, Run, pause/reprise, rotation et zoom.
4. Basculer images/3D, quitter/réouvrir l'écran, passer en arrière-plan.
5. Revenir à Explorer et contrôler le GPS, les monuments et la progression.
6. Si échec, conserver **la première erreur** du terminal Metro et du téléphone, le modèle d'iPhone et la version Expo Go.

**Aucun iPhone physique n'est connecté au Cloud. Le rendu iPhone n'est pas déclaré validé. Catia reste désactivée sur la carte.**
