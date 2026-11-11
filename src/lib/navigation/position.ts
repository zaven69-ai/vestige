import type { Fix } from "../game.ts";
/** Future developer rendering is separate from authoritative GPS, routing and game rewards. */
export type NavigationPosition =
  | { source: "device"; fix: Fix | null }
  | { source: "developer-preview"; fix: Fix | null };
export const realPosition = (fix: Fix | null): NavigationPosition => ({
  source: "device",
  fix,
});
export function authoritativeNavigationFix(
  position: NavigationPosition,
): Fix | null {
  return position.source === "device" ? position.fix : null;
}
