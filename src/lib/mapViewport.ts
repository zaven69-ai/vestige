export type Viewport = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
export type PoiGroupingMode = "auto" | "individual";
export type MapPoint = { id: string; latitude: number; longitude: number };
export type ViewportGroup<T> = {
  key: string;
  latitude: number;
  longitude: number;
  members: T[];
};
const longitudeDistance = (a: number, b: number) => ((a - b + 540) % 360) - 180;
function distanceMeters(a: MapPoint, b: MapPoint) {
  return Math.hypot(
    (a.latitude - b.latitude) * 111320,
    longitudeDistance(a.longitude, b.longitude) *
      111320 *
      Math.cos((a.latitude * Math.PI) / 180),
  );
}
/** Spatial hash of fixed anchors: no all-pairs scan, no arbitrary cell-boundary split.
 * City and street views keep every individual marker, including co-located POIs.
 */
export function viewportGroups<T extends MapPoint>(
  points: T[],
  region: Viewport,
  width: number,
  height: number,
  mode: PoiGroupingMode = "auto",
): ViewportGroup<T>[] {
  const latSpan = Math.max(0.00001, region.latitudeDelta);
  const lonSpan = Math.max(0.00001, region.longitudeDelta);
  const close = mode === "individual" || latSpan <= 0.03;
  const visible = points.filter(
    (p) =>
      Number.isFinite(p.latitude) &&
      Number.isFinite(p.longitude) &&
      Math.abs(longitudeDistance(p.longitude, region.longitude)) <=
        lonSpan * 0.6 &&
      Math.abs(p.latitude - region.latitude) <= latSpan * 0.6,
  );
  visible.sort((a, b) => a.id.localeCompare(b.id));
  // City/street view: every POI keeps its own illustrated, tappable marker.
  if (close)
    return visible.map((p) => ({
      key: `poi:${p.id}`,
      latitude: p.latitude,
      longitude: p.longitude,
      members: [p],
    }));
  // Deterministic seeds make source ordering irrelevant.
  const project = (p: T) => [
    (longitudeDistance(p.longitude, region.longitude) / lonSpan) *
      Math.max(1, width),
    ((p.latitude - region.latitude) / latSpan) * Math.max(1, height),
  ];
  let radius = 32;
  let result: { anchor: T; x: number; y: number; members: T[] }[];
  do {
    result = [];
    const buckets = new Map<string, number[]>();
    for (const point of visible) {
      const [x, y] = project(point),
        bx = Math.floor(x / radius),
        by = Math.floor(y / radius);
      let nearest = -1,
        best = radius * radius;
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          for (const index of buckets.get(`${bx + dx}:${by + dy}`) ?? []) {
            const g = result[index],
              d = (x - g.x) ** 2 + (y - g.y) ** 2;
            if (d <= best) {
              nearest = index;
              best = d;
            }
          }
        }
      if (nearest >= 0) result[nearest].members.push(point);
      else {
        const key = `${bx}:${by}`,
          indices = buckets.get(key) ?? [];
        indices.push(result.length);
        buckets.set(key, indices);
        result.push({ anchor: point, x, y, members: [point] });
      }
    }
    // Only distant views reach this path. Never drop members to cap the markers.
    if (result.length <= 96) break;
    radius *= 1.25;
  } while (true);
  return result.map((g) => ({
    key: `poi:${g.anchor.id}`,
    members: g.members,
    latitude:
      g.members.reduce((sum, p) => sum + p.latitude, 0) / g.members.length,
    longitude:
      region.longitude +
      g.members.reduce(
        (sum, p) => sum + longitudeDistance(p.longitude, region.longitude),
        0,
      ) /
        g.members.length,
  }));
}
/** Fit actual member bounds; coincident locations need a chooser, not endless zoom. */
export function clusterTarget<T extends MapPoint>(
  members: T[],
): Viewport | null {
  if (!members.length) return null;
  const first = members[0];
  if (members.every((p) => distanceMeters(first, p) <= 6)) return null;
  const lats = members.map((p) => p.latitude),
    lons = members.map((p) => longitudeDistance(p.longitude, first.longitude));
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats),
    minLon = Math.min(...lons),
    maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: first.longitude + (minLon + maxLon) / 2,
    latitudeDelta: Math.max(0.00015, (maxLat - minLat) * 1.8),
    longitudeDelta: Math.max(0.00015, (maxLon - minLon) * 1.8),
  };
}

/** Co-located identities remain accessible from a tapped individual marker. */
export function coincidentPois<T extends MapPoint>(point: T, points: T[]): T[] {
  return points.filter((p) => distanceMeters(point, p) <= 3);
}
