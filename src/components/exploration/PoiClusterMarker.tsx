import React, { memo, useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { Marker, type MapMarker } from "react-native-maps";
import type { Monument } from "../../data/monuments";
export type PoiGroup = {
  key: string;
  latitude: number;
  longitude: number;
  members: Monument[];
};
export const PoiClusterMarker = memo(function PoiClusterMarker({
  group,
  onSelect,
}: {
  group: PoiGroup;
  onSelect: (group: PoiGroup) => void;
}) {
  const marker = useRef<MapMarker>(null);
  useEffect(() => {
    const timer = setTimeout(() => marker.current?.redraw(), 100);
    return () => clearTimeout(timer);
  }, [group.members.length]);
  return (
    <Marker
      ref={marker}
      coordinate={{ latitude: group.latitude, longitude: group.longitude }}
      tracksViewChanges={false}
      stopPropagation
      accessibilityLabel={`${group.members.length} lieux regroupés. Agrandir ou choisir un lieu.`}
      onPress={(event) => {
        event.stopPropagation();
        onSelect(group);
      }}
    >
      <View
        collapsable={false}
        onLayout={() => marker.current?.redraw()}
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#102C48",
          borderWidth: 2,
          borderColor: "#CDB67C",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ flexDirection: "row", gap: 3, marginBottom: 1 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: 6,
                height: 8,
                borderRadius: 3,
                borderWidth: 1,
                borderColor: "#E8CD8E",
                transform: [{ translateY: i === 1 ? -2 : 0 }],
              }}
            />
          ))}
        </View>
        <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 16 }}>
          {group.members.length}
        </Text>
        <Text style={{ color: "#E8CD8E", fontSize: 9 }}>lieux</Text>
      </View>
    </Marker>
  );
});
