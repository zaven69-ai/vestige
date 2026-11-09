import { useEffect, useRef, useState } from "react";
import type { Fix } from "../../../lib/game";
import {
  avatarSpec,
  walkingDeadline,
  type AvatarPhase,
} from "../../../lib/avatar";
export type AvatarFrame = { phase: AvatarPhase; frame: number };
export function useAvatarFrame(
  fix: Fix,
  active: boolean,
  reducedMotion: boolean,
  ready: boolean,
): AvatarFrame {
  const [snapshot, setSnapshot] = useState<AvatarFrame>({
    phase: "idle",
    frame: 0,
  });
  const [epoch] = useState(() => Date.now());
  const previous = useRef<Fix | null>(null),
    until = useRef(0),
    walkStart = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (!active) {
      until.current = 0;
      previous.current = fix;
    } else if (previous.current?.timestamp !== fix.timestamp) {
      const deadline = walkingDeadline(previous.current, fix, now);
      if (deadline > now && until.current <= now) walkStart.current = now;
      until.current = deadline;
      previous.current = fix;
    }
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    function tick() {
      if (cancelled) return;
      const time = Date.now();
      const animate = active && !reducedMotion && ready;
      const phase: AvatarPhase =
        animate && time < until.current ? "walk" : "idle";
      const interval =
        phase === "walk" ? avatarSpec.walkFrameMs : avatarSpec.idleFrameMs;
      const count =
        phase === "walk" ? avatarSpec.walkFrames : avatarSpec.idleFrames;
      const frame = animate
        ? Math.floor(
            Math.max(0, time - (phase === "walk" ? walkStart.current : epoch)) /
              interval,
          ) % count
        : 0;
      setSnapshot((old) =>
        old.phase === phase && old.frame === frame ? old : { phase, frame },
      );
      if (animate) timer = setTimeout(tick, interval);
    }
    timer = setTimeout(tick, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fix, active, reducedMotion, ready, epoch]);
  return snapshot;
}
