import type { Viewport, MapPoint } from "../mapViewport.ts";
export type MiniaturePlan = { enabled: boolean; size: number };
/** Bounded screen illustration, not a metrically accurate 3D footprint. One O(n) scan for the pilot. */
export function miniaturePlan(
  poiId: string,
  points: MapPoint[],
  region: Viewport,
  height: number,
  enabled = true,
  availableIds: readonly string[] = ["auguste"],
): MiniaturePlan {
  if (
    !enabled ||
    !availableIds.includes(poiId) ||
    !Number.isFinite(region.latitudeDelta) ||
    region.latitudeDelta <= 0 ||
    region.latitudeDelta > 0.009 ||
    height <= 0
  )
    return { enabled: false, size: 64 };
  const point = points.find((p) => p.id === poiId);
  if (!point) return { enabled: false, size: 64 };
  const metersPerPixel = (region.latitudeDelta * 111320) / Math.max(1, height);
  const crowded = points.some(
    (p) =>
      p.id !== point.id &&
      Math.hypot(
        (p.latitude - point.latitude) * 111320,
        (p.longitude - point.longitude) *
          111320 *
          Math.cos((point.latitude * Math.PI) / 180),
      ) /
        metersPerPixel <
        80,
  );
  return {
    enabled: true,
    size: crowded ? 96 : region.latitudeDelta <= 0.0045 ? 128 : 112,
  };
}
export function miniatureView(heading: number): number {
  if (!Number.isFinite(heading)) return 0;
  return Math.round((((heading % 360) + 360) % 360) / 45) % 8;
}
