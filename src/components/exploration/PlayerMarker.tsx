import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Easing } from "react-native";
import { Marker, type MapMarker } from "react-native-maps";
import type { Fix } from "../../lib/game";
import { avatarMotion } from "../../lib/exploration";
import { avatarFacing, avatarSpec } from "../../lib/avatar";
import { CatiaSprite } from "./CatiaSprite";
import { useCatiaMovement } from "./avatar/useCatiaFrame";
import { catiaMapSpec, type MapPlayerChoice } from "../../lib/avatars/catiaMap";
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
  character = "catia",
  animate = true,
}: {
  fix: Fix;
  direction: number | null;
  reducedMotion: boolean;
  mapHeading: number;
  active: boolean;
  character?: MapPlayerChoice;
  animate?: boolean;
}) {
  const catiaPhase = useCatiaMovement(
    fix,
    active && animate && character === "catia",
  );
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
    active && !reducedMotion && character !== "catia",
    pack.sprites,
    `${activeChoice}:${packVersion}`,
  );
  const frame = useAvatarFrame(
    fix,
    active && character !== "catia",
    reducedMotion,
    ready,
  );
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
  const isCatia = character === "catia";
  const spec = isCatia ? catiaMapSpec : avatarSpec;
  // Catia is a single animated PNG view; no GL context is mounted on the map.
  // The previous avatar keeps its existing native-image path.
  const props = {
    ref: marker,
    image: isCatia ? undefined : image,
    anchor: spec.anchor,
    centerOffset: {
      x: 0,
      y: -(spec.height * (spec.anchor.y - 0.5)),
    },
    zIndex: 100,
    rotation: 0,
    flat: false,
    tracksViewChanges: isCatia && active && animate && !reducedMotion,
    tappable: false,
    identifier: "vestige-player",
    accessibilityLabel: isCatia
      ? "Catia, position GPS réelle du joueur"
      : "Votre explorateur VESTIGE, position GPS réelle",
  };
  const sprite = isCatia ? (
    <CatiaSprite
      facing={facing}
      phase={catiaPhase}
      active={active && animate}
      reducedMotion={reducedMotion}
      onLoad={() => marker.current?.redraw()}
    />
  ) : null;
  return Platform.OS === "android" ? (
    <Marker {...props} coordinate={initialPoint}>
      {sprite}
    </Marker>
  ) : (
    <AnimatedMarker {...props} coordinate={coordinate}>
      {sprite}
    </AnimatedMarker>
  );
}
