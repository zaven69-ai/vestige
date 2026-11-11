import type { VisitSession, LiveTour, LiveMode } from "./types.ts";
export const LIVE_SESSION_KEY = "vestige.live.visit.v1",
  LIVE_PREFS_KEY = "vestige.live.preferences.v1";
export function startVisit(tour: LiveTour, now: number): VisitSession {
  return {
    version: 1,
    tourId: tour.id,
    startedAt: now,
    index: 0,
    outcomes: {},
    autoTriggered: [],
    paused: false,
    endedAt: null,
  };
}
export function advanceVisit(
  session: VisitSession,
  tour: LiveTour,
  outcome: "consulted" | "skipped" | "listened",
  now: number,
): VisitSession {
  if (session.endedAt !== null) return session;
  const stop = tour.stops[session.index];
  if (!stop) return session;
  const index = session.index + 1;
  return {
    ...session,
    index,
    outcomes: { ...session.outcomes, [stop.poiId]: outcome },
    endedAt: index >= tour.stops.length ? now : null,
  };
}
export function restoreVisit(
  raw: string | null,
  tour: LiveTour,
): VisitSession | null {
  if (raw === null) return null;
  const s = JSON.parse(raw) as VisitSession;
  if (
    !s ||
    s.version !== 1 ||
    s.tourId !== tour.id ||
    !Number.isFinite(s.startedAt) ||
    !Number.isInteger(s.index) ||
    s.index < 0 ||
    s.index > tour.stops.length ||
    (s.index === tour.stops.length && s.endedAt === null) ||
    typeof s.paused !== "boolean" ||
    (s.endedAt !== null && !Number.isFinite(s.endedAt)) ||
    !s.outcomes ||
    typeof s.outcomes !== "object" ||
    Array.isArray(s.outcomes) ||
    !Array.isArray(s.autoTriggered) ||
    s.autoTriggered.some((v) => typeof v !== "string") ||
    Object.entries(s.outcomes).some(
      ([id, value]) =>
        !tour.stops.some((p) => p.poiId === id) ||
        !["consulted", "skipped", "listened"].includes(value),
    )
  )
    throw Error("Sauvegarde de visite illisible. Elle a été conservée.");
  return s;
}
export function restorePreferences(raw: string | null): {
  preferredMode: LiveMode;
  volume: number;
} {
  if (raw === null) return { preferredMode: "manual", volume: 1 };
  const p = JSON.parse(raw);
  if (
    !p ||
    p.version !== 1 ||
    !["manual", "automatic"].includes(p.preferredMode) ||
    !Number.isFinite(p.volume) ||
    p.volume < 0 ||
    p.volume > 1
  )
    throw Error("Préférences Live illisibles. Elles ont été conservées.");
  return p;
}
