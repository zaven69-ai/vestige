import { distance, type Fix, type Point } from "../game.ts";
export const liveGPS = {
  maxAgeMs: 15000,
  maxAccuracy: 50,
  enterMeters: 75,
  exitMeters: 105,
  dwellMs: 5000,
  cooldownMs: 60000,
  maxSpeed: 4,
} as const;
export type FenceState = {
  insideSince: number | null;
  firstFixAt: number | null;
  lastFixAt: number | null;
  armed: boolean;
  cooldownUntil: number;
};
export const emptyFence = (): FenceState => ({
  insideSince: null,
  firstFixAt: null,
  lastFixAt: null,
  armed: true,
  cooldownUntil: 0,
});
export function usableLiveFix(fix: Fix | null, now: number): fix is Fix {
  return (
    !!fix &&
    Number.isFinite(fix.latitude) &&
    Number.isFinite(fix.longitude) &&
    fix.accuracy !== null &&
    Number.isFinite(fix.accuracy) &&
    fix.accuracy >= 0 &&
    fix.accuracy <= liveGPS.maxAccuracy &&
    now >= fix.timestamp &&
    now - fix.timestamp <= liveGPS.maxAgeMs &&
    (fix.speed === undefined ||
      fix.speed === null ||
      fix.speed < 0 ||
      (Number.isFinite(fix.speed) && fix.speed <= liveGPS.maxSpeed))
  );
}
export function tickFence(
  state: FenceState,
  input: {
    fix: Fix | null;
    target: Point;
    now: number;
    active: boolean;
    foreground: boolean;
    automatic: boolean;
    eligible: boolean;
    busy: boolean;
    alreadyTriggered: boolean;
  },
): { state: FenceState; play: boolean } {
  const { now, fix } = input;
  const reset = {
    ...state,
    insideSince: null,
    firstFixAt: null,
    lastFixAt: null,
  };
  if (
    !input.active ||
    !input.foreground ||
    !input.automatic ||
    !input.eligible ||
    !usableLiveFix(fix, now)
  )
    return { state: reset, play: false };
  if (state.lastFixAt !== null && fix.timestamp < state.lastFixAt)
    return { state: reset, play: false };
  const meters = distance(fix, input.target);
  if (meters > liveGPS.exitMeters)
    return {
      state: { ...reset, armed: now >= state.cooldownUntil },
      play: false,
    };
  if (
    input.alreadyTriggered ||
    !state.armed ||
    now < state.cooldownUntil ||
    meters > liveGPS.enterMeters
  )
    return { state: meters > liveGPS.enterMeters ? reset : state, play: false };
  const entered = {
    ...state,
    insideSince: state.insideSince ?? now,
    firstFixAt: state.firstFixAt ?? fix.timestamp,
    lastFixAt: fix.timestamp,
  };
  if (
    !input.busy &&
    now - entered.insideSince >= liveGPS.dwellMs &&
    fix.timestamp - entered.firstFixAt >= liveGPS.dwellMs
  )
    return {
      state: {
        ...entered,
        armed: false,
        cooldownUntil: now + liveGPS.cooldownMs,
      },
      play: true,
    };
  return { state: entered, play: false };
}
