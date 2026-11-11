import {
  authoritativeNavigationFix,
  type NavigationPosition,
} from "../lib/navigation/position";
import { RouteRequestGate } from "../lib/navigation/requests";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { useGame } from "../lib/store";
import { distance, type Point } from "../lib/game";
import { useExplorationClock } from "./useExplorerSensors";
import {
  navigationSpec,
  validNavigationFix,
  fetchWalkingRoute,
  routeProgress,
  deviationTick,
  arrivalTick,
  type WalkingRoute,
  type DeviationState,
} from "../lib/navigation/walking";
type Snapshot = {
  key: string;
  route: WalkingRoute | null;
  status: "idle" | "loading" | "ready" | "error" | "near";
  error: string | null;
};
export function useWalkingNavigation(
  target: Point,
  targetId: string,
  active: boolean,
  position?: NavigationPosition,
) {
  const { fix: deviceFix, requestGPS } = useGame(),
    now = useExplorationClock();
  const source = position?.source ?? "device";
  const fix = authoritativeNavigationFix(
    position ?? { source: "device", fix: deviceFix },
  );
  const [enabled, setEnabled] = useState(false),
    [snapshot, setSnapshot] = useState<Snapshot>({
      key: "",
      route: null,
      status: "idle",
      error: null,
    });
  const [foreground, setForeground] = useState(
      AppState.currentState === "active",
    ),
    [arrivalStatus, setArrivalStatus] = useState({ key: "", value: false });
  const key = `${source}:${targetId}:${target.latitude}:${target.longitude}`;
  const valid = validNavigationFix(fix, now),
    running = enabled && active && foreground;
  const gate = useRef(new RouteRequestGate()),
    lastRequestAt = useRef(0);
  const deviation = useRef<DeviationState>({ since: null, firstFixAt: null }),
    arrival = useRef<DeviationState>({ since: null, firstFixAt: null });
  const live = useRef({ fix, target, key, running });
  useEffect(() => {
    live.current = { fix, target, key, running };
  }, [fix, target, key, running]);
  const cancel = useCallback(() => gate.current.cancel(), []);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state !== "active") {
        cancel();
        deviation.current = { since: null, firstFixAt: null };
        arrival.current = { since: null, firstFixAt: null };
      }
    });
    return () => sub.remove();
  }, [cancel]);
  useEffect(() => () => cancel(), [cancel]);
  const calculate = useCallback(async () => {
    const current = live.current;
    if (!current.running || !validNavigationFix(current.fix, Date.now()))
      return;
    const ticket = gate.current.begin(current.key),
      { controller } = ticket;
    lastRequestAt.current = Date.now();
    deviation.current = { since: null, firstFixAt: null };
    if (distance(current.fix, current.target) < 8) {
      setSnapshot({
        key: current.key,
        route: null,
        status: "near",
        error: null,
      });
      gate.current.finish(ticket);
      return;
    }
    setSnapshot((old) => ({
      key: current.key,
      route: old.key === current.key ? old.route : null,
      status: "loading",
      error: null,
    }));
    const timeout = setTimeout(() => {
      controller.abort();
      if (gate.current.owns(ticket, live.current.key, live.current.running)) {
        setSnapshot((old) => ({
          key: current.key,
          route: old.key === current.key ? old.route : null,
          status: "error",
          error: "Le calcul a expiré. Vérifiez le réseau puis réessayez.",
        }));
        gate.current.finish(ticket);
      }
    }, 15000);
    try {
      const route = await fetchWalkingRoute(
        current.fix,
        current.target,
        controller.signal,
      );
      if (gate.current.accepts(ticket, live.current.key, live.current.running))
        setSnapshot({ key: current.key, route, status: "ready", error: null });
    } catch (error) {
      if (gate.current.owns(ticket, live.current.key, live.current.running))
        setSnapshot((old) => ({
          key: current.key,
          route: old.key === current.key ? old.route : null,
          status: "error",
          error: controller.signal.aborted
            ? "Le calcul a expiré. Vérifiez le réseau puis réessayez."
            : `Calcul impossible : ${String(error instanceof Error ? error.message : error)}`,
        }));
    } finally {
      clearTimeout(timeout);
      gate.current.finish(ticket);
    }
  }, []);
  // Reset destination state before the single automatic request effect runs.
  useEffect(() => {
    cancel();
    arrival.current = { since: null, firstFixAt: null };
    deviation.current = { since: null, firstFixAt: null };
  }, [key, cancel]);
  useEffect(() => {
    if (!running) {
      cancel();
      arrival.current = { since: null, firstFixAt: null };
      deviation.current = { since: null, firstFixAt: null };
      return;
    }
    if (
      valid &&
      !gate.current.pending &&
      (snapshot.key !== key ||
        snapshot.status === "loading" ||
        (snapshot.status === "near" && distance(fix, target) > 20))
    ) {
      void calculate();
    }
  }, [
    running,
    valid,
    key,
    snapshot.key,
    snapshot.status,
    fix,
    target,
    calculate,
    cancel,
  ]);
  const route = enabled && snapshot.key === key ? snapshot.route : null;
  const progress = useMemo(
    () => (route && valid ? routeProgress(route, fix) : null),
    [route, valid, fix],
  );
  useEffect(() => {
    if (!running || !valid) {
      arrival.current = { since: null, firstFixAt: null };
      deviation.current = { since: null, firstFixAt: null };
      const timer = setTimeout(
        () =>
          setArrivalStatus((old) =>
            old.key === key && !old.value ? old : { key, value: false },
          ),
        0,
      );
      return () => clearTimeout(timer);
    }
    const reached = arrivalTick(arrival.current, fix, target, now);
    arrival.current = reached.state;
    const timer = setTimeout(
      () =>
        setArrivalStatus((old) =>
          old.key === key && old.value === reached.arrived
            ? old
            : { key, value: reached.arrived },
        ),
      0,
    );
    if (progress && snapshot.status === "ready" && !gate.current.pending) {
      const next = deviationTick(
        deviation.current,
        fix,
        progress.offRouteMeters,
        now,
        lastRequestAt.current,
      );
      deviation.current = next.state;
      if (next.recalculate) void calculate();
    }
    return () => clearTimeout(timer);
  }, [
    running,
    valid,
    fix,
    target,
    key,
    now,
    progress,
    snapshot.status,
    calculate,
  ]);
  const start = useCallback(() => {
    setEnabled(true);
    setSnapshot((old) => ({ ...old, key: "", error: null, status: "idle" }));
    if (source === "device" && !validNavigationFix(fix, Date.now()))
      void requestGPS();
  }, [fix, requestGPS, source]);
  const stop = useCallback(() => {
    cancel();
    setEnabled(false);
    setArrivalStatus({ key: "", value: false });
  }, [cancel]);
  const retry = useCallback(() => {
    void calculate();
  }, [calculate]);
  const offRoute =
    !!progress &&
    progress.offRouteMeters >
      Math.max(navigationSpec.offRouteMeters, (fix?.accuracy ?? 0) * 1.5);
  return {
    enabled,
    route,
    progress,
    arrived:
      running && valid && arrivalStatus.key === key && arrivalStatus.value,
    offRoute,
    status: !enabled
      ? "idle"
      : !running
        ? "paused"
        : !valid
          ? "gps"
          : snapshot.key === key
            ? snapshot.status
            : "loading",
    error: snapshot.key === key ? snapshot.error : null,
    start,
    stop,
    retry,
    valid,
    foreground,
  };
}
export type WalkingNavigation = ReturnType<typeof useWalkingNavigation>;
