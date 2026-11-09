import { distance } from "./game.ts";
import type { Fix, Point } from "./game.ts";
export type HeadingReading = {
  degrees: number;
  accuracy: number;
  timestamp: number;
};
export const GPS_MAX_AGE = 30_000;
// The UI clock ticks every 3 s; this grace covers a new sample arriving between ticks.
// Discovery uses canDiscover(Date.now()) and keeps its strict timestamp validation.
export function isFreshFix(fix: Fix | null, now: number): fix is Fix {
  return (
    !!fix &&
    Number.isFinite(fix.latitude) &&
    Number.isFinite(fix.longitude) &&
    Math.abs(fix.latitude) <= 90 &&
    Math.abs(fix.longitude) <= 180 &&
    now - fix.timestamp >= -3000 &&
    now - fix.timestamp < GPS_MAX_AGE
  );
}
export function angularDistance(a: number, b: number) {
  return Math.abs(((a - b + 540) % 360) - 180);
}
export function playerDirection(
  reading: HeadingReading | null,
  fix: Fix | null,
  now: number,
): number | null {
  if (!isFreshFix(fix, now)) return null;
  if (
    reading &&
    reading.accuracy >= 2 &&
    reading.degrees >= 0 &&
    reading.degrees < 360 &&
    now - reading.timestamp >= -3000 &&
    now - reading.timestamp < 15_000
  )
    return reading.degrees;
  if (
    fix.accuracy !== null &&
    fix.accuracy >= 0 &&
    fix.accuracy <= 25 &&
    (fix.speed ?? 0) >= 0.8 &&
    fix.heading !== undefined &&
    fix.heading !== null &&
    fix.heading >= 0 &&
    fix.heading < 360
  )
    return fix.heading;
  return null;
}
/** Filtering is visual only. Discovery and distance checks always use the raw GPS fix. */
export function avatarMotion(
  previous: Fix,
  next: Fix,
  reducedMotion: boolean,
): "hold" | "snap" | "animate" {
  if (next.timestamp <= previous.timestamp) return "hold";
  const meters = distance(previous, next);
  const threshold = Math.min(8, Math.max(3, (next.accuracy ?? 20) / 4));
  if (meters < threshold) return "hold";
  if (
    reducedMotion ||
    next.timestamp - previous.timestamp >= GPS_MAX_AGE ||
    meters > 150 ||
    next.accuracy === null ||
    next.accuracy > 50
  )
    return "snap";
  return "animate";
}
export function explorationCamera(center: Point, immersive: boolean) {
  return {
    center: { latitude: center.latitude, longitude: center.longitude },
    pitch: immersive ? 45 : 0,
    heading: 0,
    altitude: 800,
    zoom: 17,
  };
}
export const historicalPeriods = [
  "Antiquité",
  "Moyen Âge",
  "Renaissance",
  "Époque moderne",
  "Époque contemporaine",
] as const;
export type HistoricalPeriod = (typeof historicalPeriods)[number];
export function historicalPeriod(era: string): HistoricalPeriod {
  if (
    era === "Antiquité" ||
    era === "Moyen Âge" ||
    era === "Renaissance" ||
    era === "Époque moderne"
  )
    return era;
  return "Époque contemporaine";
}
