import React, { memo, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker, type MapMarker } from "react-native-maps";
import { Icon, colors } from "../ui";
import { historicalPeriod, type HistoricalPeriod } from "../../lib/exploration";
import type { Monument } from "../../data/monuments";
const periods: Record<
  HistoricalPeriod,
  { color: string; symbol: React.ComponentProps<typeof Icon>["name"] }
> = {
  Antiquité: { color: "#e3bd76", symbol: "library-outline" },
  "Moyen Âge": { color: "#bec9c3", symbol: "shield-outline" },
  Renaissance: { color: "#d6a399", symbol: "color-palette-outline" },
  "Époque moderne": { color: "#b1bbdb", symbol: "telescope-outline" },
  "Époque contemporaine": { color: "#99cbbb", symbol: "business-outline" },
};
export const HistoricalMarker = memo(function HistoricalMarker({
  monument,
  selected,
  discovered,
  onSelect,
}: {
  monument: Monument;
  selected: boolean;
  discovered: boolean;
  onSelect: (monument: Monument) => void;
}) {
  const marker = useRef<MapMarker>(null);
  const period = periods[historicalPeriod(monument.era)];
  useEffect(() => {
    const timer = setTimeout(() => marker.current?.redraw(), 100);
    return () => clearTimeout(timer);
  }, [selected, discovered]);
  return (
    <Marker
      ref={marker}
      coordinate={monument}
      identifier={monument.id}
      stopPropagation
      anchor={{ x: 0.5, y: 0.85 }}
      tracksViewChanges={false}
      zIndex={selected ? 20 : discovered ? 5 : 10}
      onPress={(event) => {
        event.stopPropagation();
        onSelect(monument);
      }}
      accessibilityLabel={`${monument.name}, ${discovered ? "découvert" : "à explorer"}`}
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
              borderColor: selected
                ? colors.ink
                : discovered
                  ? colors.green
                  : period.color,
              backgroundColor: discovered ? "#254a40" : colors.bg,
            },
            selected && styles.selected,
          ]}
        >
          <Icon
            name={period.symbol}
            size={18}
            color={discovered ? colors.green : period.color}
          />
          {discovered && (
            <View style={styles.check}>
              <Text style={styles.tick}>✓</Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.tip,
            { borderTopColor: discovered ? colors.green : period.color },
          ]}
        />
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
    borderRadius: 12,
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
  check: {
    position: "absolute",
    right: -5,
    top: -6,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  tick: { fontSize: 10, color: colors.bg, fontWeight: "900" },
});
