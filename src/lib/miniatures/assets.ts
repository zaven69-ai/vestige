import type { ImageRequireSource } from "react-native";
export type MonumentMiniature = {
  poiId: string;
  kind: "pre-rendered-2.5d";
  views: readonly ImageRequireSource[];
  preview: ImageRequireSource;
  description: string;
  sources: readonly { title: string; url: string }[];
};
/** Register only finished, source-documented packs. No placeholder theatre or Cybèle entry. */
const auguste: MonumentMiniature = {
  poiId: "auguste",
  kind: "pre-rendered-2.5d",
  views: [
    require("../../../assets/monuments/miniatures/auguste/view-0.png"),
    require("../../../assets/monuments/miniatures/auguste/view-1.png"),
    require("../../../assets/monuments/miniatures/auguste/view-2.png"),
    require("../../../assets/monuments/miniatures/auguste/view-3.png"),
    require("../../../assets/monuments/miniatures/auguste/view-4.png"),
    require("../../../assets/monuments/miniatures/auguste/view-5.png"),
    require("../../../assets/monuments/miniatures/auguste/view-6.png"),
    require("../../../assets/monuments/miniatures/auguste/view-7.png"),
  ],
  preview: require("../../../assets/monuments/miniatures/auguste/preview.png"),
  description:
    "Miniature 2.5D de l’état actuel restauré, aux proportions simplifiées. Socle bleu nuit et or décoratif Vestige. Ce n’est ni un relevé architectural ni une reconstitution antique certifiée.",
  sources: [
    {
      title: "Temple — Office de tourisme Vienne Condrieu",
      url: "https://www.vienne-condrieu.com/patrimoine-culturel/temple-dauguste-et-de-livie-vienne/",
    },
    {
      title: "Description architecturale — Wikipédia",
      url: "https://fr.wikipedia.org/wiki/Temple_d%27Auguste_et_de_Livie",
    },
    {
      title: "Photographie de référence — Jacques MOSSOT, CC BY-SA 4.0",
      url: "https://commons.wikimedia.org/wiki/File:Vienne_-_Temple_d%27Auguste_et_de_Julie_-2.JPG",
    },
  ],
};
export const monumentMiniatures: Readonly<Record<string, MonumentMiniature>> = {
  auguste,
};
export const miniatureFor = (poiId: string): MonumentMiniature | undefined =>
  monumentMiniatures[poiId];

export const miniaturePoiIds = Object.keys(monumentMiniatures);
