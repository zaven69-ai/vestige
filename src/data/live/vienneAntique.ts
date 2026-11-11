import raw from "./stories.json";
import type { LiveStory, LiveTour } from "../../lib/live/types";
export const liveStories = raw as LiveStory[];
export {liveAssets} from "./audioAssets";
export const vienneAntique: LiveTour = {
  id: "vienne-antique-v1",
  title: "Vienne antique",
  subtitle: "Du forum aux gradins de Vienna",
  stops: [
    {
      poiId: "auguste",
      storyId: "vienne-antique-temple",
      approach: { latitude: 45.525698, longitude: 4.874218 },
      access:
        "Place Charles-de-Gaulle : observation extérieure depuis l’espace public. Fiche officielle : accès toute l’année. Respecter les éventuelles restrictions sur place.",
      sourceUrl: raw[0].sources[0].url,
      checkedAt: "2026-11-11",
    },
    {
      poiId: "cybele",
      storyId: "vienne-antique-cybele",
      approach: { latitude: 45.524969, longitude: 4.875451 },
      access:
        "Square Vassy, jardin de Cybèle : accès libre selon la fiche officielle. Ne pas franchir les protections des vestiges.",
      sourceUrl: raw[1].sources[0].url,
      checkedAt: "2026-11-11",
    },
    {
      poiId: "theatre-vienne",
      storyId: "vienne-antique-theatre",
      approach: { latitude: 45.524787, longitude: 4.878314 },
      access:
        "7 rue de Goris : site à horaires et entrée généralement payante, avec fermetures événementielles. Rester dans l’espace public si fermé ; consulter les conditions actualisées.",
      sourceUrl: raw[2].sources[0].url,
      checkedAt: "2026-11-11",
    },
  ],
};
