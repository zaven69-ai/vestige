import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Marker, type MapMarker } from "react-native-maps";
import { PoiGlyph } from "../poi/PoiGlyph";
import {
  poiCategory,
  poiStatus,
  categoryLabels,
  statusLabels,
} from "../../lib/poi";

import type { Monument } from "../../data/monuments";
import type { MonumentState } from "../../lib/markerState";
export const HistoricalMarker = memo(function HistoricalMarker({
  monument,
  selected,
  state,
  onSelect,
  reducedMotion,
}: {
  reducedMotion: boolean;
  monument: Monument;
  selected: boolean;
  state: MonumentState;
  onSelect: (monument: Monument) => void;
}) {
  const [pulse, setPulse] = useState(0.8);
  useEffect(() => {
    if (!selected || reducedMotion) return;
    let ticks = 0;
    const timer = setInterval(() => {
      ticks++;
      setPulse(ticks % 2 ? 0.45 : 1);
      if (ticks >= 8) clearInterval(timer);
    }, 180);
    return () => clearInterval(timer);
  }, [selected, reducedMotion]);
  const marker = useRef<MapMarker>(null);
  const redraw = useCallback(() => marker.current?.redraw(), []);
  useEffect(() => {
    const timer = setTimeout(() => marker.current?.redraw(), 100);
    return () => clearTimeout(timer);
  }, [selected, state, monument, pulse]);
  return (
    <Marker
      ref={marker}
      coordinate={{
        latitude: monument.latitude,
        longitude: monument.longitude,
      }}
      identifier={monument.id}
      stopPropagation
      anchor={{ x: 0.5, y: 0.9 }}
      tracksViewChanges={false}
      zIndex={
        selected
          ? 30
          : state === "nearby"
            ? 20
            : state === "discovered"
              ? 5
              : 10
      }
      onPress={(event) => {
        event.stopPropagation();
        onSelect(monument);
      }}
      accessibilityLabel={`${monument.name}, ${categoryLabels[poiCategory(monument)]}, ${statusLabels[poiStatus(monument)]}, ${state === "discovered" ? "déjà découvert" : state === "nearby" ? "à portée" : "non découvert"}`}
    >
      <View
        collapsable={false}
        onLayout={() => marker.current?.redraw()}
        style={{
          width: 64,
          height: 66,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PoiGlyph
          onLoad={redraw}
          landmarkId={monument.id}
          glowOpacity={reducedMotion ? 1 : pulse}
          category={poiCategory(monument)}
          status={poiStatus(monument)}
          size={selected ? 62 : 52}
          selected={selected}
          progress={
            state === "discovered"
              ? "discovered"
              : state === "nearby"
                ? "nearby"
                : "none"
          }
        />
      </View>
    </Marker>
  );
});
