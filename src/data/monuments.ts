import data from "./monuments.json";
import imported from "./imported-pois.json";
import { ImageSourcePropType } from "react-native";
export type City = "Vienne" | "Lyon";
export type Monument = Omit<(typeof data)[number], "city" | "image"> & {
  city: City;
  image: ImageSourcePropType;
  reviewStatus?: string;
  category?: string;
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
const curated: Monument[] = data.map((m) => ({
  ...m,
  city: m.city as City,
  image: images[m.id],
}));
/** Imported candidates remain distinct from editorially verified monuments. */
const importedCandidates: Monument[] = imported.map((m) => ({
  ...m,
  city: m.city as City,
  image: require("../../assets/brand/vestige-logo.png"),
}));
export const monuments: Monument[] = [...curated, ...importedCandidates];
export const cities: Record<City, { latitude: number; longitude: number }> = {
  Vienne: { latitude: 45.5254, longitude: 4.878 },
  Lyon: { latitude: 45.7602, longitude: 4.826 },
};
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
