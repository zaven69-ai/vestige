import React from "react";
import { View, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { monuments } from "../../data/monuments";
import { s } from "../ui";
export function RoutePreview({ ids }: { ids: string[] }) {
  const points = ids
    .map((id) => monuments.find((p) => p.id === id))
    .filter((p) => !!p);
  if (!points.length) return null;
  const latitudes = points.map((p) => p.latitude),
    longitudes = points.map((p) => p.longitude);
  return (
    <View style={{ gap: 5 }}>
      <View style={{ height: 190, borderRadius: 16, overflow: "hidden" }}>
        <MapView
          key={ids.join(":")}
          style={{ flex: 1 }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          initialRegion={{
            latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
            longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
            latitudeDelta: Math.max(
              0.008,
              (Math.max(...latitudes) - Math.min(...latitudes)) * 1.5,
            ),
            longitudeDelta: Math.max(
              0.008,
              (Math.max(...longitudes) - Math.min(...longitudes)) * 1.5,
            ),
          }}
        >
          {points.map((p, i) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              title={`${i + 1}. ${p.name}`}
              pinColor="#CBA65A"
            />
          ))}
        </MapView>
      </View>
      <Text style={s.caption}>
        Aperçu des lieux publics sélectionnés. L’itinéraire piéton réel sera
        calculé dans Explorer. Votre position n’est pas affichée.
      </Text>
    </View>
  );
}
