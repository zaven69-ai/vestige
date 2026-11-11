import React, { memo, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker, type MapMarker } from "react-native-maps";
import { Icon } from "../ui";
import { colors, theme } from "../../theme";
import { historicalPeriod, type HistoricalPeriod } from "../../lib/exploration";
import type { Monument } from "../../data/monuments";
import type { MonumentState } from "../../lib/markerState";
const periods: Record<
  HistoricalPeriod,
  React.ComponentProps<typeof Icon>["name"]
> = {
  Antiquité: "library-outline",
  "Moyen Âge": "shield-outline",
  Renaissance: "color-palette-outline",
  "Époque moderne": "telescope-outline",
  "Époque contemporaine": "business-outline",
};
const states = {
  undiscovered: { color: colors.blue, label: "À explorer", symbol: "" },
  nearby: { color: colors.coral, label: "À portée", symbol: "•" },
  discovered: { color: colors.turquoise, label: "Découvert", symbol: "✓" },
  featured: { color: colors.violet, label: "Sélection VESTIGE", symbol: "✦" },
};
export const HistoricalMarker = memo(function HistoricalMarker({
  monument,
  selected,
  state,
  onSelect,
}: {
  monument: Monument;
  selected: boolean;
  state: MonumentState;
  onSelect: (monument: Monument) => void;
}) {
  const marker = useRef<MapMarker>(null);
  const appearance = states[state];
  useEffect(() => {
    const timer = setTimeout(() => marker.current?.redraw(), 100);
    return () => clearTimeout(timer);
  }, [selected, state]);
  return (
    <Marker
      ref={marker}
      coordinate={monument}
      identifier={monument.id}
      stopPropagation
      anchor={{ x: 0.5, y: 0.85 }}
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
      accessibilityLabel={`${monument.name}, ${appearance.label}`}
    >
      <View
        collapsable={false}
        onLayout={() => marker.current?.redraw()}
        style={styles.bounds}
      >
        <View
          style={[
            styles.pin,
            {
              borderColor: selected ? colors.ink : appearance.color,
              backgroundColor: state === "nearby" ? colors.raised : colors.bg,
            },
            selected && styles.selected,
          ]}
        >
          <Icon
            name={periods[historicalPeriod(monument.era)]}
            size={18}
            color={appearance.color}
          />
          {!!appearance.symbol && (
            <View style={[styles.state, { backgroundColor: appearance.color }]}>
              <Text style={styles.symbol}>{appearance.symbol}</Text>
            </View>
          )}
        </View>
        <View style={[styles.tip, { borderTopColor: appearance.color }]} />
      </View>
    </Marker>
  );
});
const styles = StyleSheet.create({
  bounds: {
    width: 46,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { borderWidth: 2.5, transform: [{ scale: 1.1 }] },
  tip: {
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    marginTop: -1,
  },
  state: {
    position: "absolute",
    right: -5,
    top: -6,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  symbol: { fontSize: 10, color: colors.bg, fontWeight: "900" },
});
