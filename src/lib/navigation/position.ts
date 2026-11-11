import type { Fix } from "../game.ts";
/** Tagged position for real navigation or an explicitly ephemeral developer preview. */
export type NavigationPosition =
  | { source: "device"; fix: Fix | null }
  | { source: "developer-preview"; fix: Fix | null; previewKey?: string };
export const realPosition = (fix: Fix | null): NavigationPosition => ({
  source: "device",
  fix,
});
export function authoritativeNavigationFix(
  position: NavigationPosition,
): Fix | null {
  return position.source === "device" ? position.fix : null;
}

/** Routing is allowed in an explicit development preview; this never authorizes persistence. */
export function routingPositionFix(
  position: NavigationPosition,
  development: boolean,
): Fix | null {
  return position.source === "device" || development ? position.fix : null;
}

export function navigationPositionKey(position: NavigationPosition) {
  return position.source === "device"
    ? "device"
    : `developer-preview:${position.previewKey ?? ""}`;
}
