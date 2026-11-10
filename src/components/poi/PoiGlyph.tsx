import { landmarkAssets } from "./landmarks";
import React, { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { poiAssets } from "./assets";
import type { PoiCategory, PoiStatus } from "../../lib/poi";
export const PoiGlyph = memo(function PoiGlyph({
  category,
  status,
  size = 52,
  selected = false,
  progress = "none",
  onLoad,
  landmarkId,
  glowOpacity = 0.8,
}: {
  onLoad?: () => void;
  landmarkId?: string;
  glowOpacity?: number;
  category: PoiCategory;
  status: PoiStatus;
  size?: number;
  selected?: boolean;
  progress?: "none" | "nearby" | "discovered" | "completed";
}) {
  const halo = selected || progress === "nearby";
  return (
    <View style={{ width: size, height: (size * 56) / 52 }}>
      {halo && (
        <View
          style={[
            styles.halo,
            {
              borderColor: selected ? "#E8D19A" : "#F77B54",
              opacity: selected ? glowOpacity : 1,
            },
          ]}
        />
      )}
      <Image
        source={
          landmarkId && landmarkAssets[landmarkId]
            ? landmarkAssets[landmarkId][status]
            : poiAssets[category][status]
        }
        onLoad={onLoad}
        style={{ width: size, height: (size * 56) / 52 }}
        resizeMode="contain"
        accessible={false}
      />
      {(progress === "discovered" || progress === "completed") && (
        <View style={styles.progress}>
          <Text style={styles.check}>
            {progress === "completed" ? "✓✓" : "✓"}
          </Text>
        </View>
      )}
    </View>
  );
});
const styles = StyleSheet.create({
  halo: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 2,
    bottom: 3,
    borderWidth: 1.5,
    borderRadius: 25,
    backgroundColor: "#FFFFFF0A",
  },
  progress: {
    position: "absolute",
    top: 1,
    left: 1,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    backgroundColor: "#081626",
    borderColor: "#FFFFFF",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  check: { fontSize: 10, color: "#FFFFFF", fontWeight: "800" },
});
