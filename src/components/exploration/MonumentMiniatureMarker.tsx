import React, { memo, useEffect, useRef, useState } from "react";
import { Animated, Image, Text, View } from "react-native";
import { Marker, type MapMarker } from "react-native-maps";
import type { Monument } from "../../data/monuments";
import type { MonumentState } from "../../lib/markerState";
import { poiStatus, statusColors, statusLabels } from "../../lib/poi";
import { miniatureFor } from "../../lib/miniatures/assets";
import { miniatureView, type MiniaturePlan } from "../../lib/miniatures/policy";
import { IllustratedPoiMarker } from "./IllustratedPoiMarker";
type Props = {
  monument: Monument;
  state: MonumentState;
  selected: boolean;
  onSelect: (m: Monument) => void;
  onOpenMiniature: (m: Monument) => void;
  reducedMotion: boolean;
  mapHeading: number;
  plan: MiniaturePlan;
};
export const MonumentMiniatureMarker = memo(function MonumentMiniatureMarker(
  props: Props,
) {
  if (!miniatureFor(props.monument.id) || !props.plan.enabled)
    return (
      <IllustratedPoiMarker
        monument={props.monument}
        state={props.state}
        selected={props.selected}
        onSelect={props.onSelect}
        reducedMotion={props.reducedMotion}
      />
    );
  return <MiniatureBitmap {...props} />;
});
function MiniatureBitmap(props: Props) {
  const {
    monument,
    state,
    selected,
    onSelect,
    onOpenMiniature,
    reducedMotion,
    mapHeading,
    plan,
  } = props;
  const pack = miniatureFor(monument.id),
    view = miniatureView(mapHeading);
  const source = pack?.views[view];
  const marker = useRef<MapMarker>(null);
  const [failed, setFailed] = useState(false),
    [loaded, setLoaded] = useState<number | null>(null),
    [snapshot, setSnapshot] = useState("");
  const [opacity] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));
  const status = poiStatus(monument);
  const signature = `${source}:${plan.size}:${state}:${selected}:${status}`;
  useEffect(() => {
    if (!plan.enabled || loaded !== source) return;
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: reducedMotion ? 0 : 220,
      useNativeDriver: true,
    });
    animation.start();
    const timer = setTimeout(
      () => {
        marker.current?.redraw();
        setSnapshot(signature);
      },
      reducedMotion ? 80 : 300,
    );
    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [plan.enabled, source, loaded, signature, reducedMotion, opacity]);
  if (!plan.enabled || !pack || !source || failed)
    return (
      <IllustratedPoiMarker
        monument={monument}
        state={state}
        selected={selected}
        onSelect={onSelect}
        reducedMotion={reducedMotion}
      />
    );
  const size = plan.size;
  const review = status.includes("unreviewed")
    ? "Non vérifié"
    : status === "community_pending"
      ? "En attente"
      : status.startsWith("community")
        ? "Communauté vérifiée"
        : "Vérifié rédaction";
  return (
    <Marker
      ref={marker}
      coordinate={{
        latitude: monument.latitude,
        longitude: monument.longitude,
      }}
      identifier={`miniature-${monument.id}`}
      tappable
      stopPropagation
      anchor={{ x: 0.5, y: (size * 0.84) / (size + 28) }}
      centerOffset={{
        x: 0,
        y: -(size + 28) * ((size * 0.84) / (size + 28) - 0.5),
      }}
      tracksViewChanges={snapshot !== signature}
      zIndex={selected ? 30 : 8}
      accessibilityLabel={`${monument.name}, miniature 2.5D, ${statusLabels[status]}, ${state === "discovered" ? "déjà découvert" : state === "nearby" ? "à portée" : "non découvert"}. Ouvrir la fiche historique.`}
      onPress={(event) => {
        event.stopPropagation();
        onOpenMiniature(monument);
      }}
    >
      <View
        collapsable={false}
        style={{
          position: "relative",
          width: size,
          height: size + 28,
          alignItems: "center",
        }}
        pointerEvents="none"
      >
        <Animated.View style={{ opacity }}>
          <Image
            source={source}
            style={{ width: size, height: size }}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={() => setLoaded(source)}
            onError={(event) => {
              console.warn(
                `[Vestige miniature ${monument.id}]`,
                event.nativeEvent.error,
              );
              setFailed(true);
            }}
          />
        </Animated.View>
        <View
          style={{
            position: "absolute",
            bottom: 0,
            backgroundColor: "#07152CF5",
            borderRadius: 8,
            borderWidth: selected ? 2 : 1,
            borderColor: selected
              ? "#FFE6A6"
              : state === "nearby"
                ? "#68D4CD"
                : statusColors[status],
            paddingHorizontal: 5,
            paddingVertical: 3,
            maxWidth: size,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: "#F4DEAC",
              fontSize: 10,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Temple · 2.5D{state === "discovered" ? " ✓" : ""}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: statusColors[status],
              fontSize: 9,
              textAlign: "center",
            }}
          >
            {review}
            {state === "nearby" ? " · À portée" : ""}
          </Text>
        </View>
      </View>
    </Marker>
  );
}
