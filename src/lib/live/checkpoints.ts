import type { LiveTour, VisitSession } from "./types.ts";
import { restoreVisit } from "./session.ts";
export const LIVE_CHECKPOINTS_KEY = "vestige.live.tour-checkpoints.v1";
export type TourCheckpoints = {
  version: 1;
  activeTourId: string | null;
  sessions: Record<string, VisitSession>;
};
export const emptyCheckpoints = (): TourCheckpoints => ({
  version: 1,
  activeTourId: null,
  sessions: {},
});
export function readCheckpoints(
  raw: string | null,
  tours: LiveTour[],
): TourCheckpoints {
  if (raw === null) return emptyCheckpoints();
  const value = JSON.parse(raw);
  if (
    !value ||
    value.version !== 1 ||
    !value.sessions ||
    typeof value.sessions !== "object" ||
    Array.isArray(value.sessions) ||
    (value.activeTourId !== null && typeof value.activeTourId !== "string")
  )
    throw Error("Progression des parcours illisible. Données conservées.");
  for (const [id, s] of Object.entries(value.sessions)) {
    const tour = tours.find((t) => t.id === id);
    if (!tour || !restoreVisit(JSON.stringify(s), tour))
      throw Error("Parcours sauvegardé inconnu. Données conservées.");
  }
  if (value.activeTourId !== null && !value.sessions[value.activeTourId])
    throw Error("Parcours actif invalide. Données conservées.");
  return value;
}
export function checkpoint(
  store: TourCheckpoints,
  session: VisitSession,
): TourCheckpoints {
  return {
    version: 1,
    activeTourId: session.tourId,
    sessions: { ...store.sessions, [session.tourId]: session },
  };
}

export function restoreTourState(
  saved: string | null,
  legacy: string | null,
  tours: LiveTour[],
) {
  const store = readCheckpoints(saved, tours);
  const legacyId = legacy ? JSON.parse(legacy)?.tourId : null;
  const legacyTour = legacyId ? tours.find((t) => t.id === legacyId) : tours[0];
  if (!legacyTour)
    throw Error("Parcours sauvegardé inconnu. Données conservées.");
  const prior = restoreVisit(legacy, legacyTour);
  const session =
    saved !== null
      ? store.activeTourId
        ? store.sessions[store.activeTourId]
        : null
      : prior;
  return { store: session ? checkpoint(store, session) : store, session };
}
