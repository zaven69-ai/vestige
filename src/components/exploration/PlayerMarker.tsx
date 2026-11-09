import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Easing, View } from "react-native";
import { Marker, type MapMarker } from "react-native-maps";
import { ExplorerAvatar } from "./ExplorerAvatar";
import type { Fix } from "../../lib/game";
import { avatarMotion } from "../../lib/exploration";
import { theme } from "../../theme";
const AnimatedMarker = Animated.createAnimatedComponent(Marker);
export function PlayerMarker({
  fix,
  direction,
  reducedMotion,
  mapHeading,
}: {
  fix: Fix;
  direction: number | null;
  reducedMotion: boolean;
  mapHeading: number;
}) {
  const [initialPoint] = useState(() => ({
    latitude: fix.latitude,
    longitude: fix.longitude,
  }));
  const [coordinate] = useState(() => ({
    latitude: new Animated.Value(fix.latitude),
    longitude: new Animated.Value(fix.longitude),
  }));
  const marker = useRef<MapMarker | null>(null);
  const previous = useRef(fix);
  const directional = direction !== null;
  // MapKit ignores Marker.rotation. Rotate the 2D view relative to the native camera instead.
  const screenRotation =
    Platform.OS === "ios" && direction !== null ? direction - mapHeading : 0;
  useEffect(() => {
    const motion = avatarMotion(previous.current, fix, reducedMotion);
    if (motion === "hold") return;
    previous.current = fix;
    const point = { latitude: fix.latitude, longitude: fix.longitude };
    const duration = motion === "snap" ? 0 : theme.motion.travel;
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
  }, [coordinate, fix, reducedMotion]);
  // Native maps snapshot custom views on Android: redraw only on layout/appearance changes.
  useEffect(() => {
    const timer = setTimeout(() => marker.current?.redraw(), 150);
    return () => clearTimeout(timer);
  }, [directional, screenRotation]);
  const props = {
    ref: marker,
    anchor: { x: 0.5, y: 0.5 },
    zIndex: 100,
    rotation: Platform.OS === "android" ? (direction ?? 0) : 0,
    flat: Platform.OS === "android" && directional,
    tracksViewChanges: false,
    title: "Votre explorateur · position GPS réelle",
    identifier: "vestige-player",
  };
  const avatar = (
    <View
      collapsable={false}
      onLayout={() => marker.current?.redraw()}
      style={{
        width: 72,
        height: 72,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ transform: [{ rotate: `${screenRotation}deg` }] }}>
        <ExplorerAvatar size={52} directional={directional} />
      </View>
    </View>
  );
  return Platform.OS === "android" ? (
    <Marker {...props} coordinate={initialPoint}>
      {avatar}
    </Marker>
  ) : (
    <AnimatedMarker {...props} coordinate={coordinate}>
      {avatar}
    </AnimatedMarker>
  );
}
