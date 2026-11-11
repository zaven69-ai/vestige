# Communauté Supabase

Dans Vestige, ouvrez **Communauté → Communauté en ligne**. L’inscription et la connexion utilisent l’e-mail et le mot de passe. Si la confirmation par e-mail est activée, confirmez le lien avant la première connexion. Un brouillon ou un parcours créé dans le fil de l’appareil peut être copié explicitement vers le compte connecté. Le compte B actualise le fil pour voir les publications de A. Le bouton **Lancer dans Explorer** reprend les étapes connues du catalogue. Les photos et les sources restent dans les copies locales. La récupération du mot de passe dans l’app reste à intégrer.

## Migrations

- `20261111163805_vestige_community_foundation.sql` reproduit le SQL inscrit dans l’historique du projet Vestige. Sa version est déjà appliquée.
- `20261111171902_vestige_save_route.sql` ajoute la sauvegarde atomique des étapes, la validation de publication et les droits minimaux de l’API. Un itinéraire publié garde ses étapes et son ordre. L’auteur peut modifier le titre ou le récit, ou supprimer le parcours entier. La suppression retire aussi ses étapes, favoris et signalements liés. Créer un nouvel itinéraire repasse par un brouillon et la validation de publication.
- `supabase/drafts/202611110001_community.sql` est l’ancien schéma de préparation, conservé pour son test historique. Il définit un autre modèle et entre en conflit avec la table `community_reports` réelle.

Le SQL valide le format et l’ordre des identifiants. L’application vérifie aussi leur présence dans son catalogue. Les parcours communautaires ne sont jamais une source de narration automatique pour George.

## Démarrer sur Windows

Dans le dossier du dépôt, avec Node 24 et depuis PowerShell.

```powershell
git fetch origin
git switch --track origin/codex/issue-13-supabase
npm ci
Copy-Item .env.example .env.local
notepad .env.local
npm run start:tunnel
```

Renseignez la clé **Publishable** depuis **Supabase Dashboard → Project Settings → API Keys**. Le fichier `.env.local` est ignoré par Git. Vérifiez aussi que le fournisseur e-mail est activé dans Authentication et que le lien de confirmation mène à un site autorisé dans **URL Configuration**. Après confirmation, revenez dans Expo Go pour vous connecter. Supabase peut limiter l’envoi de confirmations avec son SMTP intégré. Configurez votre SMTP de test si nécessaire.

## Vérifier

Le test SQL utilise deux identités PostgreSQL distinctes et une base jetable PGlite.

```powershell
npm install --prefix "$env:TEMP\vestige-pg" --no-audit --no-fund @electric-sql/pglite
$env:PGLITE_MODULE = "$env:TEMP\vestige-pg\node_modules\@electric-sql\pglite"
node scripts/community/check-supabase-routes.cjs
```

Pour tester l’API Auth et le partage, utilisez un environnement Supabase de test avec la migration relue et deux comptes confirmés. Renseignez localement `VESTIGE_TEST_A_EMAIL`, `VESTIGE_TEST_A_PASSWORD`, `VESTIGE_TEST_B_EMAIL` et `VESTIGE_TEST_B_PASSWORD` comme variables d’environnement. Le script supprime le parcours et la publication temporaires après le test.

```powershell
node --env-file=.env.local scripts/community/check-supabase-accounts.mjs
```

Pour le test sur deux iPhone, connectez un compte par appareil. Publiez avec A une découverte et un parcours avec Saint-Jean et Fourvière. Avec B, actualisez le fil, ouvrez le parcours dans Explorer, enregistrez-le puis retirez-le des favoris. Déconnectez et relancez l’app pour vérifier les transitions de session.
