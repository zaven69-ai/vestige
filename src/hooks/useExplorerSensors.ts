import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import * as Location from "expo-location";
import { angularDistance, type HeadingReading } from "../lib/exploration";
export function useExplorerHeading(enabled: boolean) {
  const [reading, setReading] = useState<HeadingReading | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    void Location.watchHeadingAsync((value) => {
      if (cancelled) return;
      const next = {
        degrees: value.trueHeading,
        accuracy: value.accuracy,
        timestamp: Date.now(),
      };
      setReading((previous) => {
        if (
          previous &&
          previous.accuracy === next.accuracy &&
          angularDistance(previous.degrees, next.degrees) < 8 &&
          next.timestamp - previous.timestamp < 5000
        )
          return previous;
        return next;
      });
    })
      .then((result) => {
        if (cancelled) result.remove();
        else subscription = result;
      })
      .catch(() => {
        if (!cancelled) setReading(null);
      });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);
  return enabled ? reading : null;
}
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
export function useExplorationClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
