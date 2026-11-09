import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Easing } from "react-native";
import { Marker, type MapMarker } from "react-native-maps";
import type { Fix } from "../../lib/game";
import { avatarMotion } from "../../lib/exploration";
import { avatarFacing, avatarSpec } from "../../lib/avatar";
import { theme } from "../../theme";
import { useAvatarPreferences } from "../../lib/avatars/preferences";
import { useAvatarFrame } from "./avatar/useAvatarFrame";
import { useAvatarAssets } from "./avatar/useAvatarAssets";
const AnimatedMarker = Animated.createAnimatedComponent(Marker);
export function PlayerMarker({
  fix,
  direction,
  reducedMotion,
  mapHeading,
  active,
}: {
  fix: Fix;
  direction: number | null;
  reducedMotion: boolean;
  mapHeading: number;
  active: boolean;
}) {
  const { pack, activeChoice, packVersion } = useAvatarPreferences();
  const [initialPoint] = useState(() => ({
    latitude: fix.latitude,
    longitude: fix.longitude,
  }));
  const [coordinate] = useState(() => ({
    latitude: new Animated.Value(fix.latitude),
    longitude: new Animated.Value(fix.longitude),
  }));
  const marker = useRef<MapMarker | null>(null),
    previous = useRef(fix);
  const facing = avatarFacing(direction, mapHeading);
  const ready = useAvatarAssets(
    facing,
    active && !reducedMotion,
    pack.sprites,
    `${activeChoice}:${packVersion}`,
  );
  const frame = useAvatarFrame(fix, active, reducedMotion, ready);
  const pose =
    active && !reducedMotion && ready
      ? frame
      : { phase: "idle" as const, frame: 0 };
  const image = pack.sprites[facing][pose.phase][pose.frame];
  useEffect(() => {
    const motion = avatarMotion(previous.current, fix, reducedMotion);
    if (motion === "hold") return;
    previous.current = fix;
    const point = { latitude: fix.latitude, longitude: fix.longitude };
    const duration = motion === "snap" || !active ? 0 : theme.motion.travel;
    if (Platform.OS === "android")
      marker.current?.animateMarkerToCoordinate(point, duration);
    else {
      const config = {
        duration,
        easing: Easing.linear,
        useNativeDriver: false,
      };
      const animation = Animated.parallel([
        Animated.timing(coordinate.latitude, {
          ...config,
          toValue: point.latitude,
        }),
        Animated.timing(coordinate.longitude, {
          ...config,
          toValue: point.longitude,
        }),
      ]);
      animation.start();
      return () => animation.stop();
    }
  }, [coordinate, fix, reducedMotion, active]);
  // Native image swaps work with tracksViewChanges=false. No animated custom-view bitmap snapshots.
  const props = {
    ref: marker,
    image,
    anchor: avatarSpec.anchor,
    centerOffset: {
      x: 0,
      y: -(avatarSpec.height * (avatarSpec.anchor.y - 0.5)),
    },
    zIndex: 100,
    rotation: 0,
    flat: false,
    tracksViewChanges: false,
    tappable: false,
    identifier: "vestige-player",
    accessibilityLabel: "Votre explorateur VESTIGE, position GPS réelle",
  };
  return Platform.OS === "android" ? (
    <Marker {...props} coordinate={initialPoint} />
  ) : (
    <AnimatedMarker {...props} coordinate={coordinate} />
  );
}
