import { useEffect, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { useLive } from "../lib/live/LiveProvider";
import { useWalkingNavigation } from "./useWalkingNavigation";
import { liveStories } from "../data/live/vienneAntique";
import { monuments } from "../data/monuments";
import type { NavigationPosition } from "../lib/navigation/position";
/** Explorer owns the only guidance instance. No preview coordinate enters the game store. */
export function useExplorerGuidance(
  focused: boolean,
  position?: NavigationPosition,
) {
  const live = useLive(),
    { session, tour } = live;
  const authoritative = position?.source !== "developer-preview";
  const { setVisible } = live;
  const active = !!session && session.endedAt === null;
  const stop = tour.stops[Math.min(session?.index ?? 0, tour.stops.length - 1)];
  const navigation = useWalkingNavigation(
    stop.approach,
    stop.poiId,
    focused && live.foreground && active && !session?.paused,
    position,
  );
  const { start, stop: stopNavigation } = navigation;
  const params = useLocalSearchParams<{ guide?: string; command?: string }>();
  const handled = useRef("");
  useEffect(() => {
    setVisible(focused && active && authoritative);
    return () => setVisible(false);
  }, [focused, active, authoritative, setVisible]);
  useEffect(() => {
    if (
      focused &&
      active &&
      params.guide === "start" &&
      params.command &&
      handled.current !== params.command
    ) {
      handled.current = params.command;
      start();
    }
  }, [focused, active, params.guide, params.command, start]);
  useEffect(() => {
    if (!active) stopNavigation();
  }, [active, stopNavigation]);
  return {
    live,
    tour,
    session,
    active,
    stop,
    navigation,
    stageKey: session
      ? `${session.startedAt}:${session.tourId}:${session.index}`
      : "",
    monument: monuments.find((m) => m.id === stop.poiId)!,
    story: liveStories.find((s) => s.id === stop.storyId),
  };
}
export type ExplorerGuidance = ReturnType<typeof useExplorerGuidance>;
