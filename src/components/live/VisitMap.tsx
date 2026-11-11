import { formatWalkingTime } from "../../lib/navigation/walking";
import type { WalkingNavigation } from "../../hooks/useWalkingNavigation";
import React, { useRef, useState, useEffect } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import MapView, { Polyline } from "react-native-maps";
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
import { formatDistance } from "../../lib/game";
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
  navigation,
}: {
  selectedId: string;
  active: boolean;
  onSelect: (monument: Monument) => void;
  navigation: WalkingNavigation;
}) {
  const { fix, journal } = useGame(),
    now = useExplorationClock(),
    reduced = useReducedMotion();
  const fresh = isFreshFix(fix, now),
    heading = useExplorerHeading(active && fresh);
  const map = useRef<MapView>(null);
  const [mapHeading, setMapHeading] = useState(0);
  const [following, setFollowing] = useState(true);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const direction = playerDirection(heading, fix, now);
  useEffect(() => {
    if (!navigation.enabled || !following || !active || !fresh) return;
    const camera = {
      center: { latitude: fix.latitude, longitude: fix.longitude },
      pitch: 45,
      altitude: 400,
      zoom: 18,
      ...(direction !== null ? { heading: direction } : {}),
    };
    if (reduced) map.current?.setCamera(camera);
    else map.current?.animateCamera(camera, { duration: 650 });
  }, [navigation.enabled, following, active, fresh, fix, direction, reduced]);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ height: 420, borderRadius: 20, overflow: "hidden" }}>
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
          showsCompass={false}
          onPanDrag={() => setFollowing(false)}
          onTouchStart={(event) => {
            const p = event.nativeEvent.touches[0];
            touch.current = p ? { x: p.pageX, y: p.pageY } : null;
          }}
          onTouchMove={(event) => {
            const touches = event.nativeEvent.touches,
              p = touches[0];
            if (
              touches.length > 1 ||
              (p &&
                touch.current &&
                Math.hypot(
                  p.pageX - touch.current.x,
                  p.pageY - touch.current.y,
                ) > 6)
            )
              setFollowing(false);
          }}
          onTouchEnd={() => {
            touch.current = null;
          }}
          onRegionChangeComplete={() => {
            void map.current
              ?.getCamera()
              .then((c) => setMapHeading(c.heading))
              .catch(() => {});
          }}
        >
          {navigation.route && (
            <>
              <Polyline
                coordinates={navigation.route.coordinates}
                strokeColor="#07152C"
                strokeWidth={10}
                zIndex={1}
              />
              <Polyline
                coordinates={navigation.route.coordinates}
                strokeColor="#E8CD8E"
                strokeWidth={5}
                zIndex={2}
              />
            </>
          )}
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
              direction={direction}
              mapHeading={mapHeading}
              active={active}
              reducedMotion={reduced}
              character="catia"
            />
          )}
        </MapView>
        {navigation.status === "ready" &&
          navigation.valid &&
          navigation.progress &&
          !navigation.offRoute &&
          !navigation.arrived && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                right: 10,
                padding: 10,
                borderRadius: 14,
                backgroundColor: "#020D27F5",
                borderWidth: 1,
                borderColor: "#CDB67C",
              }}
            >
              <Text
                numberOfLines={2}
                style={{ color: "#F7E5B7", fontSize: 14, fontWeight: "700" }}
              >
                {navigation.progress.nextInstruction
                  ? `Dans ${formatDistance(navigation.progress.metersToTurn)} : ${navigation.progress.nextInstruction}`
                  : navigation.progress.instruction}
              </Text>
              <Text style={{ color: "#BAC8DA", fontSize: 12 }}>
                {formatDistance(navigation.progress.remainingMeters)} · ≈{" "}
                {formatWalkingTime(navigation.progress.remainingSeconds)} à pied
              </Text>
            </View>
          )}
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
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFollowing(false);
            map.current?.fitToCoordinates(stops, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: !reduced,
            });
          }}
          style={{ padding: 10 }}
        >
          <Text style={{ color: "#32BCC0" }}>Voir les étapes</Text>
        </Pressable>
        {fresh && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFollowing(true);
              map.current?.animateCamera(
                { center: fix, pitch: 45, altitude: 400, zoom: 18 },
                { duration: reduced ? 0 : 650 },
              );
            }}
            style={{ padding: 10 }}
          >
            <Text style={{ color: "#32BCC0" }}>Suivre Catia</Text>
          </Pressable>
        )}
      </View>
      {navigation.route && (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFollowing(false);
            map.current?.fitToCoordinates(navigation.route!.coordinates, {
              edgePadding: { top: 50, bottom: 60, left: 35, right: 35 },
              animated: !reduced,
            });
          }}
          style={{ padding: 10 }}
        >
          <Text style={{ color: "#32BCC0" }}>Voir tout l’itinéraire</Text>
        </Pressable>
      )}
      <Text style={{ color: "#AABAD0", fontSize: 12 }}>
        {active && navigation.enabled && following
          ? "Caméra suivant le joueur · déplacez la carte pour explorer librement."
          : "Carte libre · touchez Suivre Catia pour recentrer."}
      </Text>
      <Pressable
        accessibilityRole="link"
        onPress={() =>
          void Linking.openURL("https://www.openstreetmap.org/copyright").catch(
            () => {},
          )
        }
      >
        <Text style={{ color: "#AABAD0", fontSize: 12 }}>
          Itinéraire piéton : Valhalla / FOSSGIS · données © contributeurs
          OpenStreetMap. Seul un trajet réellement calculé est dessiné.
        </Text>
      </Pressable>
    </View>
  );
}
