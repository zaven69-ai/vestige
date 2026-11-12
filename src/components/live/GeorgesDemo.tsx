import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import demoPaths from "../../data/live/georgesDemoPaths.json";
import { georgesCapsules } from "../../data/live/georgesCapsules";
import { useSimulationMode } from "../../lib/developer/DeveloperLocation";
import { distance, type Fix, type Point } from "../../lib/game";
import { useLive } from "../../lib/live/LiveProvider";

// The two entry streets are alternatives. The fast walk starts on rue Cléberg.
const fastStops = [0, 2, 3, 4];
type DemoPath = (typeof demoPaths)[number];
function pointAlong(path: DemoPath, meters: number): Point {
  const end = path.cumulative.findIndex((value) => value >= meters);
  if (end <= 0)
    return path.coordinates[end === 0 ? 0 : path.coordinates.length - 1];
  const a = path.coordinates[end - 1],
    b = path.coordinates[end];
  const length = path.cumulative[end] - path.cumulative[end - 1];
  const t = length ? (meters - path.cumulative[end - 1]) / length : 0;
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

export function GeorgesDemo({
  active,
  focused,
  canStart,
  fix,
  onActive,
  onArrival,
}: {
  active: boolean;
  focused: boolean;
  canStart: boolean;
  fix: Fix | null;
  onActive: (active: boolean) => void;
  onArrival: (point: Point) => void;
}) {
  const { top } = useSafeAreaInsets();
  const simulation = useSimulationMode();
  const live = useLive();
  const [index, setIndex] = useState(0);
  const [fast, setFast] = useState(false);
  const [heard, setHeard] = useState("");
  const [leg, setLeg] = useState<number | null>(null);
  const elapsed = useRef(0);
  const capsule = georgesCapsules[index];
  const { playGeorgesCapsule, playback, audioError, foreground } = live;
  const { controller } = simulation;
  const inRange =
    simulation.enabled && fix !== null && distance(fix, capsule.point) <= 15;
  const busy =
    heard !== capsule.id || (!!playback && !playback.ended && !audioError);
  const fastPosition = fastStops.indexOf(index);
  const fastDone = fast && fastPosition === fastStops.length - 1 && !busy;

  useEffect(() => {
    if (!active || !focused || leg !== null || !inRange || heard === capsule.id)
      return;
    const task = setTimeout(() => {
      if (playGeorgesCapsule(capsule)) setHeard(capsule.id);
    }, 0);
    return () => clearTimeout(task);
  }, [
    active,
    focused,
    leg,
    inRange,
    heard,
    capsule,
    playGeorgesCapsule,
    playback,
  ]);

  useEffect(() => {
    if (
      !active ||
      !fast ||
      busy ||
      !focused ||
      !foreground ||
      leg !== null ||
      fastPosition < 0 ||
      fastPosition >= demoPaths.length
    )
      return;
    const task = setTimeout(() => {
      elapsed.current = 0;
      setLeg(fastPosition);
    }, 350);
    return () => clearTimeout(task);
  }, [active, fast, busy, focused, foreground, leg, fastPosition]);

  useEffect(() => {
    if (!active || !focused || !foreground || leg === null) return;
    const path = demoPaths[leg];
    const length = path.cumulative[path.cumulative.length - 1];
    const seconds = Math.max(4, Math.min(12, length / 18));
    let last = Date.now();
    const timer = setInterval(() => {
      if (!controller.isEnabled()) return;
      const now = Date.now();
      elapsed.current += Math.min(0.25, (now - last) / 1000);
      last = now;
      if (elapsed.current >= seconds) {
        clearInterval(timer);
        const nextIndex = fastStops[leg + 1];
        controller.moveAlongDemo(georgesCapsules[nextIndex].point, 0);
        setIndex(nextIndex);
        setLeg(null);
        return;
      }
      controller.moveAlongDemo(
        pointAlong(path, (length * elapsed.current) / seconds),
        length / seconds,
      );
    }, 100);
    return () => clearInterval(timer);
  }, [active, focused, foreground, leg, controller]);

  function start(rapid: boolean) {
    const first = georgesCapsules[0];
    if (!controller.enable(first.point)) return;
    setHeard("");
    setLeg(null);
    setFast(rapid);
    setIndex(0);
    onActive(true);
    onArrival(first.point);
  }

  function stop() {
    live.closeAudio();
    controller.disable();
    onActive(false);
  }

  function next() {
    const target = georgesCapsules[index + 1];
    if (!target) return;
    live.closeAudio();
    setFast(false);
    if (controller.teleportTo(target.point)) {
      setIndex(index + 1);
      onArrival(target.point);
    }
  }

  if (!__DEV__ || !focused) return null;
  if (!active) {
    if (!canStart || simulation.enabled) return null;
    return (
      <View style={{ position: "absolute", top: top + 62, right: 14 }}>
        <View style={{ gap: 6, alignItems: "flex-end" }}>
          <DemoButton title="Démo Georges" onPress={() => start(false)} />
          <DemoButton
            title="Marche rapide · Georges"
            onPress={() => start(true)}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        position: "absolute",
        top: top + 53,
        left: 14,
        right: 14,
        padding: 12,
        gap: 6,
        borderRadius: 14,
        backgroundColor: "#07152C",
        borderWidth: 1,
        borderColor: "#C6A86A",
      }}
    >
      <Text style={{ color: "#F2D9A0", fontSize: 15, fontWeight: "700" }}>
        {fast ? fastPosition + 1 : index + 1}/
        {fast ? fastStops.length : georgesCapsules.length} · {capsule.title}
      </Text>
      <Text style={{ color: "#B6C5D8", fontSize: 12 }}>
        {leg !== null
          ? "Marche rapide vers " + georgesCapsules[fastStops[leg + 1]].title
          : fastDone
            ? "Fin de la marche rapide"
            : inRange
              ? "Arrivée simulée · lecture automatique"
              : "Approche du point d’écoute"}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(!fast || fastDone) && index < georgesCapsules.length - 1 && (
          <DemoButton
            title="Simuler l’arrivée suivante"
            disabled={busy}
            onPress={next}
          />
        )}
        <DemoButton title="Quitter la démo" onPress={stop} />
      </View>
    </View>
  );
}

function DemoButton({
  title,
  disabled = false,
  onPress,
}: {
  title: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: 12,
        borderRadius: 9,
        backgroundColor: "#263956",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Text style={{ color: "#F2D9A0", fontWeight: "600" }}>{title}</Text>
    </Pressable>
  );
}
