export type Point = { latitude: number; longitude: number };
export type Fix = Point & { accuracy: number | null; timestamp: number };
export const DISCOVERY_RADIUS = 100;
export function distance(a: Point, b: Point): number {
  const r = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * r,
    dLon = (b.longitude - a.longitude) * r;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * r) *
      Math.cos(b.latitude * r) *
      Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function canDiscover(
  fix: Fix | null,
  target: Point,
  now = Date.now(),
): boolean {
  return (
    !!fix &&
    fix.accuracy !== null &&
    fix.accuracy >= 0 &&
    fix.accuracy <= 50 &&
    now - fix.timestamp < 30000 &&
    now >= fix.timestamp &&
    distance(fix, target) <= DISCOVERY_RADIUS
  );
}
export function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}
export function levelFor(xp: number) {
  return Math.floor(xp / 400) + 1;
}
export function readJournal(
  raw: string | null,
  allowedIds: string[],
): Record<string, number> {
  const parsed: unknown = raw ? JSON.parse(raw) : {};
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Carnet invalide");
  return Object.fromEntries(
    Object.entries(parsed).filter(
      ([id, date]) =>
        allowedIds.includes(id) &&
        typeof date === "number" &&
        Number.isFinite(date) &&
        date > 0,
    ),
  );
}
export function totalXP(
  journal: Record<string, number>,
  catalogue: { id: string; xp: number }[],
): number {
  return catalogue.reduce(
    (total, monument) => total + (journal[monument.id] ? monument.xp : 0),
    0,
  );
}
