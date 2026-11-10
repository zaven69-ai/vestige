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
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "#102C48",
          borderWidth: 2,
          borderColor: "#CDB67C",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
          {group.members.length}
        </Text>
      </View>
    </Marker>
  );
});
