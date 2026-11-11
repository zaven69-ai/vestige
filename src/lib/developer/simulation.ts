import type { Fix, Point } from "../game.ts";
export type StickVector = { east: number; north: number };
export const SIMULATION_STEP_MS = 250;
export const WALK_METERS_PER_SECOND = 1.4;
export function validPoint(point: Point) {
  return (
    Number.isFinite(point.latitude) &&
    Math.abs(point.latitude) <= 85 &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.longitude) <= 180
  );
}
export function stickVector(x: number, y: number, mapHeading = 0): StickVector {
  if (![x, y, mapHeading].every(Number.isFinite)) return { east: 0, north: 0 };
  const magnitude = Math.hypot(x, y);
  if (magnitude < 0.12) return { east: 0, north: 0 };
  const scale = Math.max(1, magnitude),
    angle = (mapHeading * Math.PI) / 180;
  return {
    east: (x * Math.cos(angle) + y * Math.sin(angle)) / scale,
    north: (-x * Math.sin(angle) + y * Math.cos(angle)) / scale,
  };
}
export function simulatedStep(
  fix: Fix,
  vector: StickVector,
  seconds: number,
  now: number,
): Fix {
  const magnitude = Math.min(1, Math.hypot(vector.east, vector.north));
  if (magnitude === 0)
    return { ...fix, speed: 0, timestamp: Math.max(now, fix.timestamp + 1) };
  const speed = WALK_METERS_PER_SECOND * magnitude;
  const dt = Math.max(0, Math.min(0.5, seconds)); // Never catch up after backgrounding.
  const metersPerDegree = (6371000 * Math.PI) / 180;
  return {
    latitude:
      fix.latitude +
      (vector.north * WALK_METERS_PER_SECOND * dt) / metersPerDegree,
    longitude:
      ((fix.longitude +
        (vector.east * WALK_METERS_PER_SECOND * dt) /
          (metersPerDegree * Math.cos((fix.latitude * Math.PI) / 180)) +
        540) %
        360) -
      180,
    accuracy: 5,
    timestamp: Math.max(now, fix.timestamp + 1),
    speed,
    heading:
      magnitude > 0
        ? ((Math.atan2(vector.east, vector.north) * 180) / Math.PI + 360) % 360
        : (fix.heading ?? 0),
  };
}
export type SimulationSnapshot = {
  enabled: boolean;
  fix: Fix | null;
  epoch: number;
  teleport: number;
};
/** No storage, analytics or reward APIs. Production instances cannot be enabled. */
export class LocationSimulation {
  private snapshot: SimulationSnapshot = {
    enabled: false,
    fix: null,
    epoch: 0,
    teleport: 0,
  };
  private vector: StickVector = { east: 0, north: 0 };
  private listeners = new Set<() => void>();
  private readonly development: boolean;
  constructor(development: boolean) {
    this.development = development;
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  isEnabled = () => this.development && this.snapshot.enabled;
  canCommitRealProgress = () => !this.isEnabled();
  private publish(next: SimulationSnapshot) {
    this.snapshot = next;
    this.listeners.forEach((f) => f());
  }
  enable = (point: Point, now = Date.now()) => {
    if (!this.development || !validPoint(point)) return false;
    this.vector = { east: 0, north: 0 };
    this.publish({
      enabled: true,
      epoch: this.snapshot.epoch + 1,
      teleport: 0,
      fix: { ...point, accuracy: 5, timestamp: now, heading: 0, speed: 0 },
    });
    return true;
  };
  disable = () => {
    this.vector = { east: 0, north: 0 };
    this.publish({
      enabled: false,
      fix: null,
      epoch: this.snapshot.epoch + 1,
      teleport: 0,
    });
  };
  setStick = (x: number, y: number, heading = 0) => {
    this.vector = this.isEnabled()
      ? stickVector(x, y, heading)
      : { east: 0, north: 0 };
  };
  stop = () => {
    this.vector = { east: 0, north: 0 };
  };
  teleportTo = (point: Point, now = Date.now()) => {
    if (!this.isEnabled() || !validPoint(point)) return false;
    this.stop();
    this.publish({
      ...this.snapshot,
      teleport: this.snapshot.teleport + 1,
      fix: {
        ...point,
        accuracy: 5,
        timestamp: Math.max(now, (this.snapshot.fix?.timestamp ?? 0) + 1),
        heading: 0,
        speed: 0,
      },
    });
    return true;
  };
  tick = (seconds: number, now = Date.now()) => {
    if (!this.isEnabled() || !this.snapshot.fix) return;
    this.publish({
      ...this.snapshot,
      fix: simulatedStep(this.snapshot.fix, this.vector, seconds, now),
    });
  };
}
