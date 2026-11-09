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
  const groups = new Map<string, T[]>();
  for (const point of points) {
    const dx = ((point.longitude - region.longitude + 540) % 360) - 180;
    const dy = point.latitude - region.latitude;
    // Overscan accommodates the tilted camera and keeps markers near the edges.
    if (Math.abs(dx) > longitudeSpan || Math.abs(dy) > latitudeSpan) continue;
    const key = `${Math.floor(((dx / longitudeSpan + 0.5) * width) / 52)}:${Math.floor(((dy / latitudeSpan + 0.5) * height) / 52)}`;
    groups.set(key, [...(groups.get(key) ?? []), point]);
  }
  return [...groups.entries()].map(([key, members]) => ({
    key,
    members,
    latitude: members.reduce((n, p) => n + p.latitude, 0) / members.length,
    longitude: members.reduce((n, p) => n + p.longitude, 0) / members.length,
  }));
}
