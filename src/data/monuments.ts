import data from "./monuments.json";
import { heritagePhotos } from "./generated/photos";
import heritage from "./generated/heritage.json";
import { ImageSourcePropType } from "react-native";
export type City = string;
export type SourceRef = {
  provider: string;
  id: string;
  url: string;
  license: string;
};
export type Monument = Omit<(typeof data)[number], "city" | "image"> & {
  city: City;
  image: ImageSourcePropType | undefined;
  category?: string;
  timeline?: { date: string; label: string; source: string }[];
  sourceRefs?: SourceRef[];
  contentQuality?: string;
  aliases?: string[];
  coordinateSource?: {
    provider: string;
    url: string;
    method?: string;
    precisionDegrees?: number | null;
  };
};
const images: Record<string, ImageSourcePropType> = {
  auguste: require("../../assets/monuments/auguste.jpg"),
  "theatre-vienne": require("../../assets/monuments/theatre-vienne.jpg"),
  "saint-maurice": require("../../assets/monuments/saint-maurice.jpg"),
  "saint-andre": require("../../assets/monuments/saint-andre.jpg"),
  fourviere: require("../../assets/monuments/fourviere.jpg"),
  "theatre-lyon": require("../../assets/monuments/theatre-lyon.jpg"),
  "saint-jean": require("../../assets/monuments/saint-jean.jpg"),
  amphitheatre: require("../../assets/monuments/amphitheatre.jpg"),
};
export const monuments: Monument[] = [
  ...data.map((m) => ({
    ...m,
    city: m.city as City,
    aliases:
      m.id === "saint-andre"
        ? ["Église Saint-André-le-Bas", "Cloître Saint-André-le-Bas"]
        : [],
    image: images[m.id],
  })),
  ...heritage.map(({ image: _image, photoPage, ...m }) => ({
    ...m,
    image: heritagePhotos[m.id]?.image,
    photoPage: heritagePhotos[m.id]?.photoPage ?? photoPage ?? "",
    attribution: heritagePhotos[m.id]?.attribution ?? "",
  })),
];
export const cities: Record<City, { latitude: number; longitude: number }> = {
  Vienne: { latitude: 45.5254, longitude: 4.878 },
  "Saint-Romain-en-Gal": { latitude: 45.5295, longitude: 4.87093 },
  "Sainte-Colombe": { latitude: 45.5265, longitude: 4.86964 },
  Lyon: { latitude: 45.7602, longitude: 4.826 },
};
for (const monument of monuments) {
  cities[monument.city] ??= {
    latitude: monument.latitude,
    longitude: monument.longitude,
  };
}
export const trails = [
  {
    id: "vienne",
    city: "Vienne" as City,
    title: "Les échos de Vienna",
    subtitle: "De Rome au Moyen Âge",
    ids: ["auguste", "saint-andre", "theatre-vienne", "saint-maurice"],
  },
  {
    id: "lyon",
    city: "Lyon" as City,
    title: "Sur les traces de Lugdunum",
    subtitle: "Deux mille ans sous vos pas",
    ids: ["amphitheatre", "saint-jean", "theatre-lyon", "fourviere"],
  },
];
