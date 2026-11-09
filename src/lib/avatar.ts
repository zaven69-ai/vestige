import type { Fix } from "./game.ts";
import { distance } from "./game.ts";
import { avatarMotion, isFreshFix } from "./exploration.ts";
export type AvatarFacing =
  "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "unknown";
export type AvatarPhase = "idle" | "walk";
export const avatarSpec = {
  width: 80,
  height: 104,
  anchor: { x: 0.5, y: 182 / 208 },
  idleFrames: 4,
  walkFrames: 6,
  idleFrameMs: 700,
  walkFrameMs: 125,
  maxWalkHoldMs: 6500,
} as const;
const facingOrder: AvatarFacing[] = [
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
  "nw",
];
export function avatarFacing(
  direction: number | null,
  mapHeading: number,
): AvatarFacing {
  if (
    direction === null ||
    !Number.isFinite(direction) ||
    !Number.isFinite(mapHeading)
  )
    return "unknown";
  const screen = (((direction - mapHeading) % 360) + 360) % 360;
  return facingOrder[Math.round(screen / 45) % 8];
}
/** Decorative gait never changes the GPS coordinate or the discovery checks. */
export function walkingDeadline(
  previous: Fix | null,
  next: Fix,
  now: number,
): number {
  if (
    !previous ||
    previous.accuracy === null ||
    previous.accuracy < 0 ||
    previous.accuracy > 35 ||
    !isFreshFix(next, now) ||
    next.accuracy === null ||
    next.accuracy > 35 ||
    next.accuracy < 0
  )
    return 0;
  const seconds = (next.timestamp - previous.timestamp) / 1000;
  if (
    seconds <= 0 ||
    seconds > 10 ||
    avatarMotion(previous, next, false) !== "animate"
  )
    return 0;
  const travel = distance(previous, next);
  const speedUnavailable =
    next.speed === null || next.speed === undefined || next.speed < 0;
  if (speedUnavailable) {
    const uncertainty = Math.max(4, (previous.accuracy + next.accuracy) / 2);
    if (travel <= uncertainty) return 0;
  }
  const speed = speedUnavailable ? travel / seconds : next.speed!;
  if (!Number.isFinite(speed) || speed < 0.6 || speed > 5) return 0;
  return Math.max(
    0,
    Math.min(now + avatarSpec.maxWalkHoldMs, next.timestamp + 7000),
  );
}
