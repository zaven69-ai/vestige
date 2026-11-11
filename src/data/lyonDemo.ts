import { monuments, cities } from "./monuments";
export const DEMO_CITY = "Lyon";
/** Existing POI objects, never copied into the catalogue or supplied to GameProvider GPS. */
const pointFor = (id: string) => monuments.find((m) => m.id === id);
export const lyonDemoPresets = [
  { title: "Centre de Lyon", point: cities.Lyon },
  ...[
    { id: "fourviere", title: "Basilique de Fourvière" },
    { id: "theatre-lyon", title: "Théâtres romains de Fourvière" },
    { id: "saint-jean", title: "Vieux Lyon · Saint-Jean" },
    { id: "osm-way-55071957", title: "Terreaux · Fontaine Bartholdi" },
  ].flatMap(({ id, title }) => {
    const point = pointFor(id);
    return point ? [{ title, point }] : [];
  }),
  {
    title: "Rue Mercière · George",
    point: { latitude: 45.762486, longitude: 4.832794 },
  },
];
// Street reference, not a new POI or historical approval: https://fr.wikipedia.org/wiki/Rue_Merci%C3%A8re_(Lyon)
