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
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: "#162639",
          borderWidth: 1.5,
          borderColor: "#DECBA4",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#FFF1D6", fontWeight: "800", fontSize: 16 }}>
          {group.members.length}
        </Text>
      </View>
    </Marker>
  );
});
