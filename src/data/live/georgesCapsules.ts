// Demo coordinates from Vestige and OpenStreetMap via Photon.
// They are simulated listening points, not on-site verified geofences.
export const georgesCapsules = [
  {
    id: "georges-01-rue-cleberg",
    title: "Rue Cléberg",
    duration: 10.5,
    transcript:
      "Tu es rue Cléberg, sur la colline de Fourvière. Au numéro dix-sept, c’est l’adresse du musée Lugdunum. Regarde la pente. On va retrouver ce relief jusque dans les gradins.",
    point: { latitude: 45.7604731, longitude: 4.8199761 },
    source:
      require("../../../assets/audio/georges-demo/01-Rue-Cleberg.mp3") as number,
  },
  {
    id: "georges-02-rue-antiquaille",
    title: "Rue de l’Antiquaille",
    duration: 9.2,
    transcript:
      "Tu es rue de l’Antiquaille. Au numéro six, tu peux rejoindre le parc archéologique par l’accès du bas. Les deux théâtres sont adossés à la même colline.",
    point: { latitude: 45.759028, longitude: 4.8211073 },
    source:
      require("../../../assets/audio/georges-demo/02-Rue-Antiquaille.mp3") as number,
  },
  {
    id: "georges-03-musee",
    title: "Musée Lugdunum",
    duration: 10.7,
    transcript:
      "Regarde comment le musée disparaît dans la pente. L’architecte Bernard Zehrfuss l’a conçu pour épouser la colline. À l’intérieur, les objets retrouvés racontent la ville romaine.",
    point: { latitude: 45.760373, longitude: 4.820519 },
    source:
      require("../../../assets/audio/georges-demo/03-Musee.mp3") as number,
  },
  {
    id: "georges-04-grand-theatre",
    title: "Grand théâtre",
    duration: 10.5,
    transcript:
      "Suis du regard l’arrondi des gradins. Après son agrandissement, ce théâtre pouvait accueillir environ dix mille personnes. Imagine la rumeur du public juste avant la comédie.",
    point: { latitude: 45.759682, longitude: 4.819723 },
    source:
      require("../../../assets/audio/georges-demo/04-Grand-Theatre.mp3") as number,
  },
  {
    id: "georges-05-odeon",
    title: "Odéon",
    duration: 9.3,
    transcript:
      "Te voilà devant l’odéon. Ici, on écoutait notamment de la musique. Si tu aperçois le sol au pied des gradins, cherche les couleurs des pierres assemblées dans le pavement.",
    point: { latitude: 45.758682, longitude: 4.819716 },
    source:
      require("../../../assets/audio/georges-demo/05-Odeon.mp3") as number,
  },
  {
    id: "georges-06-rue-des-farges",
    title: "Rue des Farges et thermes",
    duration: 10.6,
    transcript:
      "Au six, rue des Farges, regarde sous les arcades. Les murs arrondis appartenaient aux salles chaudes des thermes. Imagine le passage d’un bain chaud à l’eau froide.",
    point: { latitude: 45.7568117, longitude: 4.8201197 },
    source:
      require("../../../assets/audio/georges-demo/06-Rue-des-Farges.mp3") as number,
  },
  {
    id: "georges-07-place-abbe-larue",
    title: "Place Abbé-Larue",
    duration: 9.8,
    transcript:
      "Ici, place Abbé Larue, des fouilles ont retrouvé des fortifications de plusieurs époques. Sous le trottoir, il restait même des traces de la porte médiévale de Saint-Just.",
    point: { latitude: 45.7558406, longitude: 4.819442 },
    source:
      require("../../../assets/audio/georges-demo/07-Place-Abbe-Larue.mp3") as number,
  },
  {
    id: "georges-08-rue-des-macchabees",
    title: "Rue des Macchabées",
    duration: 10.3,
    transcript:
      "Au onze, rue des Macchabées, les archéologues ont retrouvé des sépultures et les fondations de plusieurs églises. Le quartier a changé, mais les traces sont restées sous nos pieds.",
    point: { latitude: 45.7555639, longitude: 4.8175959 },
    source:
      require("../../../assets/audio/georges-demo/08-Rue-des-Macchabees.mp3") as number,
  },
  {
    id: "georges-09-place-eugene-wernert",
    title: "Place Eugène-Wernert",
    duration: 9.7,
    transcript:
      "Ces monuments de la place Eugène Wernert bordaient autrefois une route romaine. Cinq mausolées ont été démontés puis remontés ici, pierre par pierre.",
    point: { latitude: 45.7550852, longitude: 4.8159529 },
    source:
      require("../../../assets/audio/georges-demo/09-Place-Eugene-Wernert.mp3") as number,
  },
  {
    id: "georges-10-amphitheatre-des-trois-gaules",
    title: "Amphithéâtre des Trois Gaules",
    duration: 10.0,
    transcript:
      "Tu es devant l’amphithéâtre des Trois Gaules. Il a été construit en dix-neuf après Jésus-Christ. Ici, les gradins entouraient une arène où le public assistait à des spectacles.",
    point: { latitude: 45.770556, longitude: 4.830556 },
    source:
      require("../../../assets/audio/georges-demo/10-Amphitheatre-des-Trois-Gaules.mp3") as number,
  },
];
export type GeorgesCapsule = (typeof georgesCapsules)[number];
