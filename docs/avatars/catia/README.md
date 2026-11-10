# Catia — source reçue le 10 novembre 2026

Nom donné par l'utilisateur : **Catia**. Cette source supplémentaire ne remplace aucun personnage du catalogue initial.

Le GLB original est conservé sans modification dans `assets/avatars/source/catia/avatar.glb`. Son empreinte et sa provenance sont enregistrées dans le fichier JSON adjacent. Il représente un personnage unique en pied : cheveux clairs, veste beige, tenue noire, bottines et sac. `source-preview.png` est un rendu d'inspection Blender, avec cadrage temporaire ; ce n'est ni un nouveau modèle ni un sprite intégré à la carte.

## Vérification

- GLB 2.0, générateur déclaré Tripo.
- 5 101 952 octets ; un maillage, un matériau et une texture JPEG 2048×2048 embarquée.
- 151 692 triangles ; dépassement du budget de 35 000 triangles du contrat initial.
- Aucun skin/squelette, aucune animation.
- Hauteur importée d'environ une unité ; orientation frontale à normaliser avant le contrat partagé. Les transformations utilisées pour les aperçus ne sont pas écrites dans l'original.

Le fichier est une base 3D statique, pas encore un avatar animé de production. Il n'est pas enregistré dans `characterPacks` et n'est pas chargé par le téléphone. L'avatar actuel, le GPS et les XP restent inchangés.

## Suite technique

1. Préserver cette source et créer une copie de travail Blender.
2. Préparer la géométrie : vérifier les volumes sous la veste, les mains proches des poches, le sac et les déformations attendues ; optimiser si une utilisation 3D temps réel est visée. Pour un rendu hors ligne en sprites, conserver aussi une source détaillée.
3. Normaliser l'échelle, l'orientation et la pose pour le squelette commun.
4. Créer le rigging et les poids, puis les clips idle/walk ; contrôler les bottines à talons et les intersections pendant la marche.
5. Valider visuellement les rendus et ajouter explicitement Catia au registre/sélecteur avant de l'activer.

Aucun rigging automatique approximatif, aucune génération Krea, aucune dépense et aucune publication ne sont réalisés lors de cette réception.
