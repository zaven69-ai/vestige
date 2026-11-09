import { canDiscover } from "./game.ts";
import type { Fix, Point } from "./game.ts";
export type MonumentState =
  "undiscovered" | "nearby" | "discovered" | "featured";
// An editorial selection, not a fabricated rarity score or an extra XP reward.
export const featuredMonuments = ["auguste", "fourviere"] as const;
export function monumentState(
  monument: Point & { id: string },
  discovered: boolean,
  fix: Fix | null,
  now: number,
): MonumentState {
  if (discovered) return "discovered";
  if (canDiscover(fix, monument, now)) return "nearby";
  if ((featuredMonuments as readonly string[]).includes(monument.id))
    return "featured";
  return "undiscovered";
}
