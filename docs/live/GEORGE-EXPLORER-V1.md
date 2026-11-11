# Issue #8 — George dans Explorer

## Lecture livrée

Explorer dispose d'un mini-lecteur bleu nuit/or : titre du lieu, durée et progression réelles du lecteur, lecture/pause/reprise, réécoute, fermeture et fiche détaillée avec transcription et références. Les contrôles existants sont décalés vers le haut lorsque le lecteur est visible pour préserver l'accès à Catia, au joystick et au guidage. Aucune deuxième carte ni navigation vers un onglet audio n'est créée.

Expo SDK 58 et `expo-audio ~58.0.11` sont déjà présents. `NativeNarration` reste l'unique moteur audio, pour les ressources locales et URI HTTPS. Un seul lecteur est monté dans le contexte actif (réel ou simulation). Un changement d'onglet, une interruption ou l'arrière-plan met en pause ; aucun redémarrage automatique après une interruption. L'iPhone respecte son mode silencieux (`playsInSilentMode: false`), premier plan uniquement, sans enregistrement ni mélange avec les autres sons. Désactiver le mode silencieux et régler le volume pour tester. Les erreurs et délais de chargement sont affichés avec une relance manuelle.

La fin d'un audio garde le lecteur disponible pour Réécouter et **n'avance plus automatiquement une étape**. Étape suivante reste une action explicite dans la fiche. L'écoute ne valide aucune découverte et ne donne aucun XP.

## Prototype Rue Mercière

Développeur → **Tester l'audio George — Rue Mercière** → confirmation d'écoute privée. Cette action ne nécessite ni proximité de Lyon ni activation du GPS simulé. Le statut permanent de la fiche audio est « Démonstration — contenu en cours de vérification ». Le mini-lecteur indique également le caractère non approuvé.

- Voix George, modèle `eleven_multilingual_v2`, via Krea, fournis par l'utilisateur dans l'issue #8.
- MP3 fourni : `https://app-uploads.krea.ai/audio/77630a80-f5fd-4672-a62d-e131a89a490b.mp3`.
- URL accessible lors du contrôle ; MP3 décodable de 547 987 octets, durée 34,220408 s.
- SHA-256 : `499c8d05fa2e4662dba1216bcf1aa2976631b5830b3377cdd50c4ec62fd03bb9`.
- La transcription intégrée est le **texte exact fourni par l'utilisateur**, sans nouvelle synthèse ni ajout historique.
- La référence Rue Mercière sur Wikipédia est accessible et présentée comme référence à contrôler, **pas comme validation du script**. La relecture historique reste à effectuer.

Ce prototype est séparé de `liveStories`/`liveAssets`. Il ne peut être lancé automatiquement, y compris en GPS simulé, et l'entrée est inaccessible en production (`__DEV__`). La session de parcours n'est ni démarrée, ni avancée par son écoute. Les trois scripts Vienne antique restent en préparation : zéro enregistrement approuvé dans le catalogue public.

## Droits et import privé stable

L'offre Krea/ElevenLabs ayant servi à la génération et ses justificatifs ne sont pas disponibles dans le dépôt. Les [conditions Krea](https://www.krea.ai/terms) et [conditions de publication ElevenLabs](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform) ne prouvent pas les droits de ce fichier particulier ; ElevenLabs précise notamment que son offre gratuite ne comprend pas de licence commerciale. **Aucun droit commercial ni approbation éditoriale n'est attribué ici.** Aucune génération payante ni clé TTS n'est utilisée.

Le binaire n'est donc pas publié dans GitHub. Par défaut, le test privé charge l'URL fournie avec `downloadFirst`. Cette URL reste une dépendance externe ; sa pérennité n'est pas garantie.

Pour un test local indépendant de cette URL, télécharger/conserver le MP3 original sur le PC puis exécuter depuis le dossier Vestige :

```powershell
node.exe scripts/live/import-george-private.cjs "$env:USERPROFILE\Downloads\george-rue-merciere.mp3"
npx.cmd expo start --tunnel --clear --port 8088
```

Le script vérifie le format et le SHA-256 du prototype avant de copier dans `assets/audio/private/george-demo.mp3`. Il génère `src/data/live/georgePrivateAsset.native.ts` ; Metro résout cette variante native avant le fichier de repli. Un second argument peut fournir un fichier texte de transcription locale. Les binaires et variantes privées sont ignorés par Git et ne sont pas écrasés par le paquet cumulatif. Ne pas publier ces fichiers et retirer les variantes privées avant une distribution publique tant que les droits et le texte ne sont pas validés.

L'import ne remplace jamais le modèle Catia ni le catalogue approuvé. Une URL indisponible laisse une erreur lisible et le reste de la carte utilisable ; l'import local reste possible.

## Ajout futur d'histoires définitives

Le bouton « Écouter son histoire » d'une fiche n'est actif que pour un script humainement approuvé et un asset aux droits renseignés, correspondant à sa version et son empreinte. L'intention audio est transmise à Explorer par paramètres de navigation, puis consommée quand Explorer est effectivement visible, sans délai arbitraire. Pour les histoires de parcours, le lecteur intégré est utilisé de la même manière.

Le mode automatique existant reste opt-in : uniquement `live_editorial_approved`, approbation de la version exacte, ressource autorisée, GPS précis, géozone, maintien, hysteresis/cooldown, premier plan, un seul audio. Les contenus OSM/communautaires et le prototype ne sont jamais promus automatiquement. Les assets définitifs peuvent être des modules locaux ou URI HTTPS avec les mêmes critères éditoriaux et de droits.

## Plan de test Expo Go iPhone

1. Mettre à jour par le script Windows cumulatif épinglé au commit, `npm.cmd install`, relancer Metro avec `--clear`, scanner le nouveau QR code. Conserver l'installation Expo Go et les données existantes.
2. Explorer → Développeur → Tester l'audio George — Rue Mercière → Écouter le prototype. Désactiver le mode silencieux. Vérifier le son, le nom, la progression native et la durée d'environ 34 secondes.
3. Pause, Reprendre, Rejouer, puis fin naturelle et Réécouter. Ouvrir Texte : comparer à la transcription fournie ; ouvrir la référence et vérifier l'avertissement non approuvé.
4. Vérifier que Catia, les marqueurs dorés et le guidage restent accessibles. En cours de parcours, écouter la démo : la fin ne doit pas changer l'étape ni les XP.
5. Passer dans Profil puis revenir, verrouiller/déverrouiller, recevoir un appel ou débrancher un casque : vérifier la pause et la reprise exclusivement manuelle. Ces interruptions natives nécessitent une validation matérielle.
6. Refaire en mode GPS simulé, déplacer Catia et téléporter vers un monument ; aucun XP, aucune visite réelle ni modification de parcours réel. Activer le mode automatique : le prototype ne doit jamais se lancer seul.
7. Couper le réseau avant le premier chargement : erreur récupérable sans crash. Tester l'import local original, puis relancer avec `--clear` et couper le réseau pour écouter l'asset privé.
8. Les monuments sans audio approuvé affichent Audio en préparation. Revenir au GPS réel et vérifier le parcours précédent.

## Vérifications et limites

Tests de règles audio, version/droits/URI, séparation du prototype et des narrations, progression bornée, absence de XP/étape automatique ; tests existants de géozone, interruptions et simulation conservés. Le harnais mainteneur `VESTIGE_AUDIO_TEST=1 node scripts/developer/check-simulation-browser.cjs` utilise le vrai MP3, les vrais providers/hooks et `NativeNarration`, avec un adaptateur HTMLAudio pour les services natifs : ce contrôle vérifie la lecture et l'état React, **pas le moteur natif iOS ni les interruptions téléphoniques**. Les fixtures de routage remplacent le réseau dans ce harnais.

Les exports Metro iOS/Android et le bundle iOS de développement sont vérifiés séparément. **Validation physique iPhone : en attente**, aucun appareil iOS n'est connecté au Cloud.
