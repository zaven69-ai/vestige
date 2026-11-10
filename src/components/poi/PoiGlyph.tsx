import React, { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { illustratedPoi, reviewSeals, discoverySeals } from "./illustrated";
import type { PoiCategory, PoiStatus } from "../../lib/poi";
/** Three independent layers. Seven shared illustrations; no per-POI 3D scene.
 * landmarkId is retained for existing callers, but artwork represents categories,
 * not documentary photos of a named monument.
 */
export const PoiGlyph = memo(function PoiGlyph({
  category,
  status,
  size = 52,
  selected = false,
  progress = "none",
  onLoad,
  glowOpacity = 0.8,
}: {
  category: PoiCategory;
  status: PoiStatus;
  size?: number;
  selected?: boolean;
  progress?: "none" | "nearby" | "discovered" | "completed";
  onLoad?: () => void;
  landmarkId?: string;
  glowOpacity?: number;
}) {
  const halo = selected || progress === "nearby";
  const discovery = progress === "nearby" ? "none" : progress;
  return (
    <View style={{ width: size, height: (size * 56) / 52 }}>
      {halo && (
        <View
          style={[
            styles.halo,
            {
              borderColor: selected ? "#F5D281" : "#F77B54",
              opacity: selected ? glowOpacity : 1,
            },
          ]}
        />
      )}
      <Image
        source={illustratedPoi[category]}
        onLoad={onLoad}
        resizeMode="contain"
        fadeDuration={0}
        resizeMethod="resize"
        style={{ width: size, height: (size * 56) / 52 }}
        accessible={false}
      />
      <Image
        source={reviewSeals[status]}
        onLoad={onLoad}
        resizeMode="contain"
        fadeDuration={0}
        style={[styles.review, { width: size * 0.34, height: size * 0.34 }]}
        accessible={false}
      />
      <Image
        source={discoverySeals[discovery]}
        onLoad={onLoad}
        resizeMode="contain"
        fadeDuration={0}
        style={[styles.discovery, { width: size * 0.3, height: size * 0.3 }]}
        accessible={false}
      />
    </View>
  );
});
const styles = StyleSheet.create({
  halo: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 28,
    borderWidth: 1.5,
    backgroundColor: "#F5D2810D",
  },
  review: { position: "absolute", right: -1, bottom: 5 },
  discovery: { position: "absolute", left: -1, top: 0 },
});
