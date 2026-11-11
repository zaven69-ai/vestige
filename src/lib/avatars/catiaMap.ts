import type { Fix } from "../game.ts";
import { walkingDeadline } from "../avatar.ts";
export type CatiaPhase = "idle" | "walk" | "run";
export type MapPlayerChoice = "catia" | "saved";
export const CATIA_MAP_KEY = "vestige.map.player.v1";
export const catiaMapSpec = {
  width: 96,
  height: 136,
  anchor: { x: 0.5, y: 0.9 },
  frames: { idle: 6, walk: 12, run: 8 },
  frameMs: { idle: 500, walk: 100, run: 100 },
} as const;
export function readMapPlayer(raw: string | null): MapPlayerChoice {
  if (raw === null) return "catia";
  const data: unknown = JSON.parse(raw);
  if (
    data &&
    typeof data === "object" &&
    "version" in data &&
    data.version === 1 &&
    "choice" in data &&
    (data.choice === "catia" || data.choice === "saved")
  )
    return data.choice;
  throw Error("Préférence du personnage carte illisible");
}
export function catiaMovement(
  previous: Fix | null,
  next: Fix,
  now: number,
): { phase: CatiaPhase; until: number } {
  const until = walkingDeadline(previous, next, now);
  return {
    phase:
      until > now
        ? next.speed !== null && next.speed !== undefined && next.speed >= 2.2
          ? "run"
          : "walk"
        : "idle",
    until,
  };
}
