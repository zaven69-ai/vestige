export const catiaViewerClips = [
  { id: "idle", label: "Attente" },
  { id: "walk", label: "Marche" },
  { id: "run", label: "Course" },
] as const;
export type CatiaViewerClip = (typeof catiaViewerClips)[number]["id"];
export const viewerDefaults = { distance: 3.25, yaw: 0, tilt: 0.08 };
export function viewerDistance(value: number) {
  return Number.isFinite(value)
    ? Math.max(1.4, Math.min(4.5, value))
    : viewerDefaults.distance;
}
export function viewerTilt(value: number) {
  return Number.isFinite(value)
    ? Math.max(-0.12, Math.min(0.5, value))
    : viewerDefaults.tilt;
}
export function viewerCamera(distance: number, tilt: number) {
  const radius = viewerDistance(distance);
  const angle = viewerTilt(tilt);
  const targetY = Math.max(0.9, Math.min(1.35, 0.9 + (3.25 - radius) * 0.25));
  return {
    targetY,
    y: targetY + radius * Math.sin(angle),
    z: radius * Math.cos(angle),
  };
}
export function hasCatiaClips(clips: { name: string }[]) {
  return catiaViewerClips.every((clip) =>
    clips.some((candidate) => candidate.name === clip.id),
  );
}
