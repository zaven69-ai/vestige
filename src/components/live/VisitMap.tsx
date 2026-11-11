import React, { useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import MapView from "react-native-maps";
import { monuments, type Monument } from "../../data/monuments";
import { vienneAntique } from "../../data/live/vienneAntique";
import { useGame } from "../../lib/store";
import { isFreshFix, playerDirection } from "../../lib/exploration";
import {
  useExplorationClock,
  useReducedMotion,
  useExplorerHeading,
} from "../../hooks/useExplorerSensors";
import { PlayerMarker } from "../exploration/PlayerMarker";
import { IllustratedPoiMarker } from "../exploration/IllustratedPoiMarker";
import { CatiaSprite } from "../exploration/CatiaSprite";
import { theme } from "../../theme";
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: theme.map.land }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: theme.map.water }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];
const stops = vienneAntique.stops.map((s) =>
  monuments.find((m) => m.id === s.poiId)!,
);
export function VisitMap({
  selectedId,
  active,
  onSelect,
}: {
  selectedId: string;
  active: boolean;
  onSelect: (monument: Monument) => void;
}) {
  const { fix, journal } = useGame(),
    now = useExplorationClock(),
    reduced = useReducedMotion();
  const fresh = isFreshFix(fix, now),
    heading = useExplorerHeading(active && fresh);
  const map = useRef<MapView>(null);
  const [mapHeading, setMapHeading] = useState(0);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ height: 270, borderRadius: 20, overflow: "hidden" }}>
        <MapView
          ref={map}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 45.5252,
            longitude: 4.8763,
            latitudeDelta: 0.005,
            longitudeDelta: 0.008,
          }}
          customMapStyle={mapStyle}
          userInterfaceStyle="dark"
          showsPointsOfInterests={false}
          showsUserLocation={false}
          onRegionChangeComplete={() => {
            void map.current
              ?.getCamera()
              .then((c) => setMapHeading(c.heading))
              .catch(() => {});
          }}
        >
          {stops.map((m) => (
            <IllustratedPoiMarker
              key={m.id}
              monument={m}
              state={journal[m.id] ? "discovered" : "undiscovered"}
              selected={m.id === selectedId}
              onSelect={onSelect}
              reducedMotion={reduced}
            />
          ))}
          {fresh && (
            <PlayerMarker
              fix={fix}
              direction={playerDirection(heading, fix, now)}
              mapHeading={mapHeading}
              active={active}
              reducedMotion={reduced}
              character="catia"
            />
          )}
        </MapView>
        {!fresh && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              alignSelf: "center",
              top: 26,
              alignItems: "center",
            }}
          >
            <CatiaSprite
              facing="s"
              phase="idle"
              active={active}
              reducedMotion={reduced}
            />
            <Text
              style={{
                color: "#FFFFFF",
                backgroundColor: "#020D27",
                padding: 6,
                borderRadius: 8,
              }}
            >
              Catia · aperçu sans position GPS
            </Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            map.current?.fitToCoordinates(stops, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: !reduced,
            })
          }
          style={{ padding: 10 }}
        >
          <Text style={{ color: "#32BCC0" }}>Voir les étapes</Text>
        </Pressable>
        {fresh && (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              map.current?.animateToRegion(
                { ...fix, latitudeDelta: 0.003, longitudeDelta: 0.005 },
                reduced ? 0 : 350,
              )
            }
            style={{ padding: 10 }}
          >
            <Text style={{ color: "#32BCC0" }}>Voir Catia au GPS</Text>
          </Pressable>
        )}
      </View>
      <Text style={{ color: "#AABAD0", fontSize: 12 }}>
        Repères des monuments ; aucun trajet piéton calculé. Catia au GPS peut
        se trouver hors de cette vue.
      </Text>
    </View>
  );
}
