export type Viewport = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
export type MapPoint = { id: string; latitude: number; longitude: number };
export function viewportGroups<T extends MapPoint>(
  points: T[],
  region: Viewport,
  width: number,
  height: number,
): { key: string; latitude: number; longitude: number; members: T[] }[] {
  const latitudeSpan = Math.max(0.00001, region.latitudeDelta);
  const longitudeSpan = Math.max(0.00001, region.longitudeDelta);
  // Adapt the screen-space grid instead of dropping points when zoomed out.
  // Every visible POI remains represented, but native marker views stay bounded.
  let cell = 64;
  let groups = new Map<string, T[]>();
  const visible = points.filter((point) => {
    const dx = ((point.longitude - region.longitude + 540) % 360) - 180;
    return (
      Math.abs(dx) <= longitudeSpan &&
      Math.abs(point.latitude - region.latitude) <= latitudeSpan
    );
  });
  do {
    groups = new Map();
    for (const point of visible) {
      const dx = ((point.longitude - region.longitude + 540) % 360) - 180;
      const dy = point.latitude - region.latitude;
      const key = `${cell}:${Math.floor(((dx / longitudeSpan + 0.5) * width) / cell)}:${Math.floor(((dy / latitudeSpan + 0.5) * height) / cell)}`;
      const members = groups.get(key);
      if (members) members.push(point);
      else groups.set(key, [point]);
    }
    cell *= 1.4;
  } while (groups.size > 96);
  return [...groups.entries()].map(([key, members]) => ({
    key,
    members,
    latitude: members.reduce((n, p) => n + p.latitude, 0) / members.length,
    longitude: members.reduce((n, p) => n + p.longitude, 0) / members.length,
  }));
}
