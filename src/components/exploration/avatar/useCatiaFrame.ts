import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { Fix } from "../../../lib/game";
import {
  catiaMovement,
  catiaMapSpec,
  type CatiaPhase,
} from "../../../lib/avatars/catiaMap";
export function useCatiaMovement(fix: Fix, active: boolean) {
  const previous = useRef<Fix | null>(null);
  const [phase, setPhase] = useState<CatiaPhase>("idle");
  useEffect(() => {
    const motion = catiaMovement(previous.current, fix, Date.now());
    previous.current = fix;
    const update = setTimeout(
      () => setPhase(active ? motion.phase : "idle"),
      0,
    );
    if (!active || motion.phase === "idle") return () => clearTimeout(update);
    const timer = setTimeout(
      () => setPhase("idle"),
      Math.max(0, motion.until - Date.now()),
    );
    return () => {
      clearTimeout(update);
      clearTimeout(timer);
    };
  }, [fix, active]);
  return phase;
}
/** Only the player animates; stop timers when hidden, paused or backgrounded. */
export function useCatiaFrame(
  phase: CatiaPhase,
  active: boolean,
  reducedMotion: boolean,
) {
  const [snapshot, setSnapshot] = useState({ phase, frame: 0 }),
    [foreground, setForeground] = useState(AppState.currentState === "active");
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!active || reducedMotion || !foreground) return;
    const start = Date.now();
    const timer = setInterval(
      () =>
        setSnapshot({
          phase,
          frame:
            Math.floor((Date.now() - start) / catiaMapSpec.frameMs[phase]) %
            catiaMapSpec.frames[phase],
        }),
      catiaMapSpec.frameMs[phase],
    );
    return () => clearInterval(timer);
  }, [phase, active, reducedMotion, foreground]);
  return active && !reducedMotion && foreground && snapshot.phase === phase
    ? snapshot.frame
    : 0;
}
