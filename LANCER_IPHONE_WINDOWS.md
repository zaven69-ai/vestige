# Tester Vestige et Catia sur iPhone avec Expo Go

Cette version utilise le projet existant, branche `codex/catia-mobile-preparation`. Elle conserve la carte, le GPS, les monuments, le carnet et les XP. Catia reste un aperçu séparé : elle ne remplace pas le joueur sur la carte.

## 1. Préparer Windows et l'iPhone

- Installer **Node.js 24 LTS** depuis https://nodejs.org/en/download (choisir la version 24), puis ouvrir une nouvelle fenêtre PowerShell. `node --version` doit afficher `v24...`.
- Installer/mettre à jour **Expo Go** sur l'iPhone. Le client doit prendre en charge le **SDK Expo 58** du projet.
- Prévoir une connexion Internet sur le PC et l'iPhone. Un compte Expo gratuit est nécessaire pour le tunnel Expo par défaut du SDK 58 ; aucune publication d'application ni souscription n'est nécessaire pour ce test.

## 2. Récupérer le projet complet

ZIP de la branche :

https://codeload.github.com/zaven69-ai/vestige/zip/refs/heads/codex/catia-mobile-preparation

Ce lien télécharge tous les fichiers suivis du projet : code, `package.json`, `package-lock.json`, configuration Metro, photos, carte locale et modèles Catia, y compris les sources Blender. Il exclut `node_modules`, `.git`, les caches et les exports temporaires ; ces éléments ne sont pas nécessaires pour lancer le projet. Les dépendances seront réinstallées pour Windows.

Dans PowerShell, copier les commandes suivantes :

```powershell
Set-Location "$env:USERPROFILE\Downloads"
Invoke-WebRequest -Uri "https://codeload.github.com/zaven69-ai/vestige/zip/refs/heads/codex/catia-mobile-preparation" -OutFile "vestige-catia.zip"
Expand-Archive -LiteralPath ".\vestige-catia.zip" -DestinationPath ".\Vestige-Catia-Test"
Set-Location ".\Vestige-Catia-Test\vestige-codex-catia-mobile-preparation"
node --version
npm.cmd install
npx.cmd expo login
npx.cmd expo start --tunnel
```

Choisir un nouveau dossier d'extraction si `Vestige-Catia-Test` contient déjà des fichiers ou votre propre travail. L'extraction n'est volontairement pas forcée pour éviter de les écraser. Le dossier courant doit contenir `package.json`.

Les commandes `npm.cmd` et `npx.cmd` sont les versions Windows de `npm` et `npx` ; elles évitent un blocage éventuel de `npm.ps1` par PowerShell. Les commandes habituelles `npm install` et `npx expo start --tunnel` restent utilisables si votre politique PowerShell les autorise.

`expo login` ouvre la connexion Expo dans le navigateur. Connectez-vous à votre compte gratuit ou créez-en un. Ne partagez pas votre mot de passe dans la conversation. Si vous êtes déjà connecté, cette étape peut être ignorée.

Garder PowerShell ouvert pendant les tests. Scanner le QR avec l'appareil photo de l'iPhone puis ouvrir le lien dans Expo Go.

## 3. Tester Catia

Dans l'app : **Profil → Tester Catia en 3D**. L'accès existant **Choisir mon explorateur → Examiner Catia** reste disponible.

- Attendre le chargement du GLB corrigé (environ 1,74 Mo, plus le chargement initial de l'app).
- Choisir **Attente**, **Marche** ou **Course** : ce sont les vraies animations du fichier `catia-corrected.glb`.
- Glisser un doigt dans la vue pour tourner le modèle et modifier l'angle. Les boutons permettent aussi la rotation, le zoom, la pause et la réinitialisation.
- La pause conserve la pose courante. Un changement d'animation en pause affiche la première pose du nouveau clip.
- Si « Réduire les animations » est activé sur l'iPhone, la lecture reste en pause ; la rotation et les images restent accessibles.
- Le mode **Images de contrôle** est conservé si le rendu 3D échoue. L'erreur technique est journalisée avec le préfixe `[Catia 3D]`, et une panne de l'aperçu ne remplace pas l'écran Explorer.

La vue est une scène 3D native séparée, pas une vidéo ou une image qui tourne. Elle charge le GLB corrigé existant, sans créer un nouveau personnage. Elle se ferme lorsque vous quittez l'écran ou passez l'app en arrière-plan ; elle ne continue pas de rendre en parallèle de la carte. Les instances possèdent leurs ressources pour éviter qu'une fermeture ne détruise les ressources d'un autre contexte.

La course conserve les mains près des poches et reste un jogging adapté au modèle. Aucune activation sur la carte n'est proposée, aucun GPS fictif ou XP n'est déclenché par les boutons de l'aperçu.

## 4. Tunnel : particularité du SDK 58

L'option **`--tunnel` sans argument utilise le fournisseur Expo et demande une connexion Expo**. Le lancement anonyme a été testé : il retourne explicitement une demande de connexion. Ce n'est pas un problème du fichier ZIP.

Si vous souhaitez essayer l'ancien fournisseur ngrok :

```powershell
npx.cmd expo start --tunnel ngrok
```

`@expo/ngrok` est déjà inclus dans les dépendances de développement du projet ; aucune installation globale n'est nécessaire. Cela ne garantit pas la disponibilité du service : les fournisseurs de tunnel peuvent être inaccessibles selon le réseau ou leur état. Dans le Cloud de préparation, ngrok a expiré puis fermé sa session ; aucun succès de tunnel de bout en bout n'est revendiqué ici.

Si les tunnels sont bloqués, connecter le PC et l'iPhone au **même Wi-Fi**, arrêter le serveur avec `Ctrl+C`, puis lancer :

```powershell
npx.cmd expo start --lan --clear
```

Autoriser Node.js sur le réseau privé dans le pare-feu Windows si Windows le demande. Le mode LAN évite le fournisseur de tunnel.

## 5. Si la 3D ne s'affiche pas

1. Vérifier que l'iPhone utilise un client Expo Go compatible SDK 58.
2. Vérifier que Metro reste ouvert et que le téléphone a accès au serveur/tunnel.
3. Relancer avec `npx.cmd expo start --tunnel --clear`, puis recharger Expo Go.
4. Ne pas exécuter le JavaScript sur un débogueur Chrome distant : `expo-gl` a besoin de ses appels natifs synchrones sur le téléphone. Les outils Hermes standards sont distincts de ce mode distant.
5. Basculer sur **Images de contrôle** et relever le message `[Catia 3D]` si l'erreur persiste.

`expo-gl` est fourni par Expo Go dans le SDK 58. Le projet ajoute la vue 3D, Three.js et le lecteur natif React Three Fiber, mais n'impose pas une development build pour cette solution. Une incompatibilité matérielle ou client reste à diagnostiquer sur l'appareil réel. Si un futur moteur choisi exige des modules absents d'Expo Go, une development build devra être étudiée séparément ; elle n'est pas créée ici.

## 6. Vérifications et données existantes

Commandes facultatives :

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npx.cmd expo install --check
```

L'installation `npm install`, les contrôles TypeScript/lint et les exports iOS/Android sont vérifiés dans l'environnement Linux de préparation. Un contrôle WebGL Chromium du même GLB et des contrôleurs réutilisés confirme le chargement de la texture, des 24 996 triangles, des trois clips et de la pause. Ce contrôle n'est **pas** un test natif sur iPhone et ne mesure pas ses FPS.

À tester sur l'iPhone : lecture des trois clips, pause/reprise, rotation, zoom, sortie/réouverture de l'écran, passage en arrière-plan, puis retour à la carte et contrôle du GPS, du carnet et des XP. Aucun téléphone physique n'est connecté au Cloud.

Le nom, le slug, le schéma de navigation, les clés de progression et la logique GPS ne sont pas modifiés. Ne pas désinstaller Expo Go ou vider les données pour ce test. La progression reste locale au téléphone ; aucune synchronisation de compte n'est ajoutée.
