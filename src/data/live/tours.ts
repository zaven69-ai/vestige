import { trails, monuments } from "../monuments";
import { vienneAntique, liveStories } from "./vienneAntique";
import type { LiveTour } from "../../lib/live/types";
/** Existing monuments only; other trails do not gain an audio approval by being selectable. */
export const guidedTours: LiveTour[] = [
  vienneAntique,
  ...trails.map((trail) => ({
    id: `trail-${trail.id}`,
    title: trail.title,
    subtitle: trail.subtitle,
    stops: trail.ids.map((poiId) => {
      const monument = monuments.find((m) => m.id === poiId)!;
      return {
        poiId,
        storyId: liveStories.find((s) => s.poiId === poiId)?.id ?? "",
        approach: {
          latitude: monument.latitude,
          longitude: monument.longitude,
        },
        access:
          "Repère de la fiche existante. Vérifiez les accès et horaires, restez sur les voies publiques et respectez la signalisation.",
        sourceUrl: monument.source,
        checkedAt: "",
      };
    }),
  })),
];
export const guidedTour = (id: string) => guidedTours.find((t) => t.id === id);
