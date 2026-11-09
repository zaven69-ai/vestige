# Tester la charte officielle V1 sur iPhone

Branche : `codex/official-brand-v1`, basée sur la V2 complète. Aucune fusion automatique des PR précédentes.

## Mise à jour Windows

Téléchargement : https://github.com/zaven69-ai/vestige/archive/refs/heads/codex/official-brand-v1.zip

1. Arrêtez le serveur Expo avec Ctrl+C et faites une sauvegarde de votre dossier de projet Windows.
2. Extrayez le ZIP et copiez ses fichiers dans votre dossier existant, en acceptant le remplacement des fichiers correspondants. Ne désinstallez pas Expo Go, ne réinitialisez pas son stockage.
3. Dans ce même dossier, avec Node.js 24 LTS :

   ```bat
   npm ci
   npx expo start --clear
   ```

4. Scannez le QR code avec l’iPhone et Expo Go compatible SDK 58. L’option `--clear` vide le cache de compilation, pas le carnet. Si nécessaire : `npx expo start --tunnel`.
5. Gardez si possible la même adresse réseau et le même port. Le carnet est local à l’expérience Expo Go ; ouvrir une autre expérience peut utiliser un stockage différent même si la clé n’a pas changé.

Avec Git : sauvegarder les modifications locales, puis `git fetch origin` et `git switch --track -c codex/official-brand-v1 origin/codex/official-brand-v1`. Exécuter ensuite les commandes ci-dessus. Si la branche existe déjà : `git switch codex/official-brand-v1` puis `git pull --ff-only`.

## Protocole

- Avant mise à jour, relever le carnet, les XP et le niveau. Vérifier leur conservation ensuite.
- Ouvrir les cinq onglets : surfaces bleu nuit/profond, textes blancs/gris bleuté, pas de titres serif ni d’icônes dorées.
- Explorer : carte claire, suivi/recentrage et gestes V2 préservés. Vérifier les quatre apparences de marqueurs ; « à portée » ne doit pas apparaître avec un GPS périmé, imprécis ou distant.
- Sélectionner un monument : aperçu compact. Toucher l’aperçu : fiche depuis le bas. Vérifier le défilement, les sources, la réduction par chevron ou glissement de la poignée, puis la reprise de la carte.
- À moins de 100 m, avec précision ≤ 50 m : découvrir un monument. La notification doit annoncer le bon lieu et son XP, puis le carnet et le marqueur doivent être actualisés. Réouvrir le lieu : aucune seconde récompense.
- Franchir réellement un multiple de 400 XP : niveau et notification cohérents. Aucun XP de parcours ou de défi ajouté artificiellement.
- Parcours : photos, étapes et progression réelles ; durée explicitement indicative, pas de guidage routier simulé.
- Carnet : filtre de ville et état vide corrects. Profil : badges uniquement obtenus par les découvertes, aucun faux classement.
- Tester « Réduire les animations », grands caractères, retour depuis l’arrière-plan et GPS refusé.
- Cliquer les sources historiques et photographiques ; vérifier l’ouverture des liens externes.

## Limites connues avant validation finale

Le fichier source du logo n’est pas accessible dans le Cloud. Le nom VESTIGE est provisoirement affiché en texte ; les icônes système existantes ne sont pas les nouvelles icônes officielles. Le splash natif avec logo attend aussi cet original. Les emplacements et spécifications sont documentés dans `DESIGN_SYSTEM.md` et `assets/brand/README.md`.

Aucune capture Lovable n’a été reçue comme fichier exploitable. La mise en page suit donc la charte écrite, sans prétendre reproduire ces références.

Aucun iPhone physique connecté au Cloud : les contrôles automatisés et exports ne certifient pas le rendu final sur appareil.
