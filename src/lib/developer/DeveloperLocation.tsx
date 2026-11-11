import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { AppState } from "react-native";
import { LocationSimulation, SIMULATION_STEP_MS } from "./simulation";
const Context = createContext<LocationSimulation | null>(null);
export function DeveloperLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [controller] = useState(() => new LocationSimulation(__DEV__));
  const enabled = useSyncExternalStore(
    controller.subscribe,
    controller.isEnabled,
    controller.isEnabled,
  );
  useEffect(() => {
    if (!__DEV__ || !enabled) return;
    let foreground = AppState.currentState === "active",
      last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      if (foreground) controller.tick((now - last) / 1000, now);
      last = now;
    }, SIMULATION_STEP_MS);
    const sub = AppState.addEventListener("change", (state) => {
      foreground = state === "active";
      last = Date.now();
      controller.stop();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
      controller.stop();
    };
  }, [controller, enabled]);
  return <Context.Provider value={controller}>{children}</Context.Provider>;
}
/** Use the stable controller for write guards, without subscribing reward stores to joystick frames. */
export function useSimulationController() {
  const value = useContext(Context);
  if (!value) throw Error("DeveloperLocationProvider manquant");
  return value;
}
export function useSimulation() {
  const controller = useSimulationController();
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  return { ...snapshot, controller };
}

export function useSimulationMode() {
  const controller = useSimulationController();
  const scope = useSyncExternalStore(
    controller.subscribe,
    () =>
      `${controller.getSnapshot().enabled}:${controller.getSnapshot().epoch}`,
    () => "false:0",
  );
  const [enabled, epoch] = scope.split(":");
  return { enabled: enabled === "true", epoch: Number(epoch), controller };
}
