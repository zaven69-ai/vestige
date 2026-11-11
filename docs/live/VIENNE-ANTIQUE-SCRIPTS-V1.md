# Vienne antique — scripts V1 à relire

Statut : **brouillons développeur, aucune approbation humaine enregistrée, aucun audio historique disponible**. Textes originaux de travail rédigés à partir des sources ci-dessous. Estimation de 30 à 60 s à 150 mots/minute ; aucune durée de fichier audio annoncée.

La relecture demandée par `docs/design/VIENNE-ANTIQUE-AUDIO-MVP.md` porte sur chaque version exacte. Une validation peut être donnée après lecture en indiquant les trois identifiants/version et le nom du relecteur ; toute modification de texte invalide cette validation.

## Temple d’Auguste et de Livie

Identifiant : `vienne-antique-temple` · POI existant : `auguste` · version 1.

SHA256 : `be9fbb71a0036ad9b9869c07a82b7bea2fe4a5e2746164057a79833d2da8d5ba`.

Au cœur de Vienne, le temple d’Auguste et de Livie rappelle le rôle politique et religieux du forum romain. Sa construction a connu plusieurs campagnes : une partie remonte au règne d’Auguste, tandis que d’autres éléments sont attribués au premier siècle de notre ère. Le monument était dédié à Rome et à Auguste ; le culte de Livie divinisée s’y est ensuite ajouté. Observez le podium, les colonnes et leurs chapiteaux corinthiens. Ces formes exprimaient les liens de la cité avec le pouvoir impérial. Transformé en église dans l’Antiquité tardive, l’édifice a traversé les siècles. Aujourd’hui, sa présence au milieu des rues permet de lire un fragment du centre monumental de Vienna.

Sources consultées le 11 novembre 2026 :

- [Temple d’Auguste et de Livie](https://www.vienne-condrieu.com/patrimoine-culturel/temple-dauguste-et-de-livie-vienne/) — Vienne Condrieu Tourisme. Auteur individuel et date de publication non indiqués sur la page.

- [ ] Relecture humaine effectuée : exactitude, ton de narrateur, accès et absence d’anecdote inventée.
- [ ] Version approuvée explicitement pour une narration publique.

## Jardin archéologique de Cybèle

Identifiant : `vienne-antique-cybele` · POI existant : `cybele` · version 1.

SHA256 : `fe656757a2ce654342c3d5478fcf628d15e7dae70d7566d85403cb0018484c1a`.

Le jardin de Cybèle conserve plusieurs fragments du quartier du forum de la Vienne gallo-romaine. Les vestiges visibles appartiennent à des constructions différentes : des arcades d’un portique, une salle d’assemblée municipale et les restes d’une grande maison urbaine. Ils ne formaient donc pas un seul bâtiment. Prenez le temps de regarder les volumes et les maçonneries : ces éléments aident à comprendre comment s’organisait le cœur civique de la ville. Le temple que vous venez de découvrir appartenait lui aussi à cet ensemble monumental plus vaste. Ce jardin offre une halte pour observer les traces de la cité antique, tout en distinguant ce que l’archéologie conserve de ce qui a disparu.

Sources consultées le 11 novembre 2026 :

- [Jardin archéologique de Cybèle](https://www.vienne-condrieu.com/patrimoine-culturel/jardin-archeologique-de-cybele-vienne/) — Vienne Condrieu Tourisme. Auteur individuel et date de publication non indiqués sur la page.

- [ ] Relecture humaine effectuée : exactitude, ton de narrateur, accès et absence d’anecdote inventée.
- [ ] Version approuvée explicitement pour une narration publique.

## Théâtre antique

Identifiant : `vienne-antique-theatre` · POI existant : `theatre-vienne` · version 1.

SHA256 : `a93f5f9d0ddde9ee1804edfaa2a1b3ec61e089c60ed6e99b8341ccfd507a5747`.

Adossé à la colline de Pipet, le théâtre antique de Vienne fut construit au premier siècle de notre ère, vers les années quarante à cinquante. Son hémicycle et ses gradins s’appuient sur le relief, complété par des aménagements bâtis pour accueillir le public et organiser sa circulation. Ce monument accueillait des spectacles, mais pouvait aussi servir à des rassemblements civiques. Après son abandon à la fin de l’Antiquité, il a été redécouvert puis restauré au vingtième siècle. Il reçoit à nouveau des manifestations artistiques, notamment Jazz à Vienne. L’accès intérieur dépend des horaires et de la programmation : observez depuis les espaces autorisés et consultez les informations du site avant d’entrer.

Sources consultées le 11 novembre 2026 :

- [Théâtre antique](https://www.vienne-condrieu.com/patrimoine-culturel/theatre-antique-vienne/) — Vienne Condrieu Tourisme. Auteur individuel et date de publication non indiqués sur la page.
- [Les Musées — Théâtre antique](https://vienne.fr/nos-services/culture/les-musees/) — Ville de Vienne. Auteur individuel et date de publication non indiqués sur la page.

- [ ] Relecture humaine effectuée : exactitude, ton de narrateur, accès et absence d’anecdote inventée.
- [ ] Version approuvée explicitement pour une narration publique.

## Choix documentaires et accès

Les capacités chiffrées du théâtre varient entre les fiches de la Ville (11 000) et de l’office (environ 13 000) : aucun chiffre n’est repris dans le script. Le nom de Cybèle ne sert pas à inventer une attribution cultuelle des vestiges. Les dates du temple sont présentées comme des phases de construction.

Repères d’approche issus des coordonnées intégrées aux fiches officielles (distincts des coordonnées des articles POI, qui restent inchangées) : temple 45.525698, 4.874218 ; Cybèle 45.524969, 4.875451 ; théâtre 45.524787, 4.878314. Ces repères cartographiques ne constituent pas une visite de terrain ni un point d’entrée contrôlé au centimètre.

Temple : observation depuis la place Charles-de-Gaulle, accès annoncé toute l’année. Cybèle : square Vassy, accès libre annoncé. Théâtre : 7 rue de Goris, horaires/fermetures et tarifs à consulter avant une entrée. Le 11 novembre figure parmi les fermetures annoncées ; ne jamais conseiller de franchir une fermeture.

## Enregistrements à fournir après relecture

Voix française chaleureuse de narrateur historique, lisant la version approuvée sans improvisation ; fichier MP3, M4A ou WAV de 30–60 s, droits de diffusion documentés. Aucun appel TTS payant, clé secrète ou voix synthétisée en direct n’est ajouté.

Après approbation : renseigner `approval` (texte exact, version, hash, relecteur/date), l’identifiant audio et `src/data/live/audio-manifest.json` (fichier local sous assets/live, hash, droits, version), puis exécuter `node scripts/live/register-audio.cjs`. Cette commande refuse une version non approuvée, un hash différent, une licence absente ou un fichier manquant.
