import React from "react";
import { Text, View } from "react-native";
import type { PoiRecord } from "../../lib/poi";
import {
  categoryLabels,
  poiCategory,
  poiStatus,
  statusColors,
  statusLabels,
} from "../../lib/poi";
import { PoiGlyph } from "./PoiGlyph";
export function PoiBadge({
  poi,
  compact = false,
}: {
  poi: PoiRecord & { id?: string };
  compact?: boolean;
}) {
  const status = poiStatus(poi);
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
      <PoiGlyph
        landmarkId={poi.id}
        category={poiCategory(poi)}
        status={status}
        size={compact ? 32 : 40}
      />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: "#FFFFFF", fontSize: compact ? 11 : 13 }}>
          {categoryLabels[poiCategory(poi)]}
        </Text>
        <Text
          style={{ color: statusColors[status], fontSize: 12, flexShrink: 1 }}
        >
          {statusLabels[status]}
        </Text>
      </View>
    </View>
  );
}
