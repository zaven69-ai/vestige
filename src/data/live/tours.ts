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
// Single-POI guidance uses the same engine and session protections as a trail.
export const navigationTours: LiveTour[] = [
  ...guidedTours,
  ...monuments.map((m) => ({
    id: `poi:${m.id}`,
    title: "M’y rendre",
    subtitle: m.name,
    stops: [
      {
        poiId: m.id,
        storyId: liveStories.find((s) => s.poiId === m.id)?.id ?? "",
        approach: { latitude: m.latitude, longitude: m.longitude },
        access: "Respectez les accès publics et horaires.",
        sourceUrl: m.source,
        checkedAt: "",
      },
    ],
  })),
];
const toursById = new Map(navigationTours.map((t) => [t.id, t]));
export const guidedTour = (id: string) => toursById.get(id);
