import type { ImageRequireSource } from "react-native";
export type MonumentMiniature = {
  poiId: string;
  label?: string;
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
const fourviere: MonumentMiniature = {
  poiId: "fourviere",
  label: "Fourvière",
  kind: "pre-rendered-2.5d",
  views: [
    require("../../../assets/monuments/miniatures/fourviere/view-0.png"),
    require("../../../assets/monuments/miniatures/fourviere/view-1.png"),
    require("../../../assets/monuments/miniatures/fourviere/view-2.png"),
    require("../../../assets/monuments/miniatures/fourviere/view-3.png"),
    require("../../../assets/monuments/miniatures/fourviere/view-4.png"),
    require("../../../assets/monuments/miniatures/fourviere/view-5.png"),
    require("../../../assets/monuments/miniatures/fourviere/view-6.png"),
    require("../../../assets/monuments/miniatures/fourviere/view-7.png"),
  ],
  preview: require("../../../assets/monuments/miniatures/fourviere/preview.png"),
  description:
    "État actuel stylisé : quatre tours octogonales, galerie de façade, nef et toiture verte. Les sculptures et proportions sont simplifiées ; pas un relevé scientifique.",
  sources: [
    {
      title: "Basilique de Fourvière — documentation et images de référence",
      url: "https://fr.wikipedia.org/wiki/Basilique_Notre-Dame_de_Fourvi%C3%A8re",
    },
  ],
};
const theatre_lyon: MonumentMiniature = {
  poiId: "theatre-lyon",
  label: "Théâtres",
  kind: "pre-rendered-2.5d",
  views: [
    require("../../../assets/monuments/miniatures/theatre-lyon/view-0.png"),
    require("../../../assets/monuments/miniatures/theatre-lyon/view-1.png"),
    require("../../../assets/monuments/miniatures/theatre-lyon/view-2.png"),
    require("../../../assets/monuments/miniatures/theatre-lyon/view-3.png"),
    require("../../../assets/monuments/miniatures/theatre-lyon/view-4.png"),
    require("../../../assets/monuments/miniatures/theatre-lyon/view-5.png"),
    require("../../../assets/monuments/miniatures/theatre-lyon/view-6.png"),
    require("../../../assets/monuments/miniatures/theatre-lyon/view-7.png"),
  ],
  preview: require("../../../assets/monuments/miniatures/theatre-lyon/preview.png"),
  description:
    "État archéologique actuel simplifié : cavea ouverte du grand théâtre, orchestra et petit odéon voisin. Aucune scène monumentale ni toiture antique restituée.",
  sources: [
    {
      title:
        "Théâtres romains de Fourvière — documentation et images de référence",
      url: "https://fr.wikipedia.org/wiki/Th%C3%A9%C3%A2tre_antique_de_Lyon",
    },
  ],
};
export const monumentMiniatures: Readonly<Record<string, MonumentMiniature>> = {
  auguste,
  fourviere,
  "theatre-lyon": theatre_lyon,
};
export const miniatureFor = (poiId: string): MonumentMiniature | undefined =>
  monumentMiniatures[poiId];

export const miniaturePoiIds = Object.keys(monumentMiniatures);
