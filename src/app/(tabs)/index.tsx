import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Circle } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  cities,
  monuments,
  type City,
  type Monument,
} from "../../data/monuments";
import { useGame } from "../../lib/store";
import { DISCOVERY_RADIUS, distance, formatDistance } from "../../lib/game";
import {
  angularDistance,
  avatarMotion,
  explorationCamera,
  historicalPeriod,
  historicalPeriods,
  isFreshFix,
  playerDirection,
  type HistoricalPeriod,
} from "../../lib/exploration";
import {
  useExplorationClock,
  useExplorerHeading,
  useReducedMotion,
} from "../../hooks/useExplorerSensors";
import { PlayerMarker } from "../../components/exploration/PlayerMarker";
import { HistoricalMarker } from "../../components/exploration/HistoricalMarker";
import {
  ExplorerProfile,
  MapButton,
} from "../../components/exploration/ExplorerHUD";
import { MapOptions } from "../../components/exploration/MapOptions";
import { colors, Icon } from "../../components/ui";
import { theme } from "../../theme";
import { monumentState } from "../../lib/markerState";
import { MonumentBottomSheet } from "../../components/monuments/MonumentBottomSheet";
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: theme.map.land }] },
  { elementType: "labels.text.fill", stylers: [{ color: theme.map.label }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: theme.map.water }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: theme.map.road }],
  },
];
const initialCamera = {
  ...explorationCamera(cities.Vienne, true),
  altitude: 1400,
  zoom: 16,
};
export default function Explorer() {
  const { fix, gps, requestGPS, xp, journal, storageError } = useGame();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const now = useExplorationClock();
  const fresh = isFreshFix(fix, now);
  const heading = useExplorerHeading(focused && fresh);
  const reducedMotion = useReducedMotion();
  const direction = playerDirection(heading, fix, now);
  const [following, setFollowing] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapHeading, setMapHeading] = useState(0);
  const [immersive, setImmersive] = useState(true);
  const [panel, setPanel] = useState<"settings" | "filters" | null>(null);
  const [periods, setPeriods] = useState<HistoricalPeriod[]>([
    ...historicalPeriods,
  ]);
  const [selection, setSelection] = useState<Monument | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const map = useRef<MapView>(null);
  const cameraRead = useRef({ busy: false, timestamp: 0 });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const readCameraHeading = (force = false) => {
    if (
      Platform.OS !== "ios" ||
      !map.current ||
      cameraRead.current.busy ||
      (!force && Date.now() - cameraRead.current.timestamp < 250)
    )
      return;
    cameraRead.current.busy = true;
    cameraRead.current.timestamp = Date.now();
    void map.current
      .getCamera()
      .then((camera) => {
        if (alive.current)
          setMapHeading((previous) =>
            angularDistance(previous, camera.heading) >= 3
              ? camera.heading
              : previous,
          );
      })
      .catch(() => {})
      .finally(() => {
        cameraRead.current.busy = false;
      });
  };
  const followingRef = useRef(true);
  const initialFollow = useRef(false);
  const cameraFix = useRef<typeof fix>(null);
  const touchOrigin = useRef<{ x: number; y: number } | null>(null);
  const bottom = insets.bottom + 86;
  const visibleMonuments = monuments.filter((m) =>
    periods.includes(historicalPeriod(m.era)),
  );
  const selected =
    selection && periods.includes(historicalPeriod(selection.era))
      ? selection
      : null;
  const goodGPS =
    fresh && fix.accuracy !== null && fix.accuracy >= 0 && fix.accuracy <= 50;
  const stopFollowing = useCallback(() => {
    followingRef.current = false;
    setFollowing(false);
  }, []);
  const moveCamera = useCallback(
    (camera: Parameters<MapView["animateCamera"]>[0]) => {
      if (reducedMotion) map.current?.setCamera(camera);
      else
        map.current?.animateCamera(camera, { duration: theme.motion.travel });
    },
    [reducedMotion],
  );
  useEffect(() => {
    if (
      !focused ||
      !mapReady ||
      !following ||
      !followingRef.current ||
      !fresh ||
      fix.accuracy === null ||
      fix.accuracy > 50
    )
      return;
    if (
      cameraFix.current &&
      initialFollow.current &&
      avatarMotion(cameraFix.current, fix, reducedMotion) === "hold"
    )
      return;
    cameraFix.current = fix;
    if (!initialFollow.current) {
      initialFollow.current = true;
      cameraFix.current = fix;
      moveCamera(explorationCamera(fix, immersive));
    } else
      moveCamera({
        center: { latitude: fix.latitude, longitude: fix.longitude },
      });
  }, [
    fix,
    fresh,
    following,
    mapReady,
    focused,
    immersive,
    moveCamera,
    reducedMotion,
  ]);
  const recenter = () => {
    followingRef.current = true;
    setFollowing(true);
    setSelection(null);
    initialFollow.current = false;
    if (fresh && goodGPS) {
      initialFollow.current = true;
      cameraFix.current = fix;
      moveCamera(explorationCamera(fix, immersive));
    } else void requestGPS();
  };
  const selectMonument = useCallback(
    (monument: Monument) => {
      stopFollowing();
      setSelection(monument);
    },
    [stopFollowing],
  );
  const browse = (city: City) => {
    stopFollowing();
    setSelection(null);
    moveCamera({
      ...explorationCamera(cities[city], immersive),
      altitude: 1500,
      zoom: 16,
    });
  };
  const setPerspective = (value: boolean) => {
    setImmersive(value);
    moveCamera({ pitch: value ? 45 : 0 });
  };
  const status = storageError
    ? "Carnet à vérifier"
    : !fix
      ? "Activer le GPS"
      : !fresh
        ? "GPS à actualiser"
        : !goodGPS
          ? "GPS imprécis"
          : following
            ? "Exploration · suivi actif"
            : "Exploration libre";
  return (
    <View style={styles.root}>
      {focused && <StatusBar style="dark" />}
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialCamera={initialCamera}
        customMapStyle={mapStyle}
        userInterfaceStyle="light"
        showsCompass={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        showsBuildings
        showsIndoors={false}
        pitchEnabled
        rotateEnabled
        moveOnMarkerPress={false}
        onMapReady={() => setMapReady(true)}
        onPanDrag={stopFollowing}
        onRegionChange={() => readCameraHeading()}
        onRegionChangeComplete={() => readCameraHeading(true)}
        onRegionChangeStart={(_region, details) => {
          if (details.isGesture) stopFollowing();
        }}
        onTouchStart={(event) => {
          const point = event.nativeEvent.touches[0];
          touchOrigin.current = point
            ? { x: point.pageX, y: point.pageY }
            : null;
        }}
        onTouchMove={(event) => {
          const touches = event.nativeEvent.touches;
          const point = touches[0];
          if (
            touches.length > 1 ||
            (point &&
              touchOrigin.current &&
              Math.hypot(
                point.pageX - touchOrigin.current.x,
                point.pageY - touchOrigin.current.y,
              ) > 6)
          )
            stopFollowing();
        }}
        onTouchEnd={() => {
          touchOrigin.current = null;
        }}
        onPress={() => setSelection(null)}
      >
        {visibleMonuments.map((monument) => (
          <HistoricalMarker
            key={monument.id}
            monument={monument}
            state={monumentState(monument, !!journal[monument.id], fix, now)}
            selected={selected?.id === monument.id}
            onSelect={selectMonument}
          />
        ))}
        {fresh && (
          <>
            <Circle
              center={fix}
              radius={DISCOVERY_RADIUS}
              fillColor={
                goodGPS ? theme.map.proximityFill : theme.map.uncertainFill
              }
              strokeColor={
                goodGPS ? theme.map.proximityStroke : theme.map.uncertainStroke
              }
              strokeWidth={1}
            />
            {fix.accuracy !== null &&
              fix.accuracy > 10 &&
              fix.accuracy <= 250 && (
                <Circle
                  center={fix}
                  radius={fix.accuracy}
                  fillColor={theme.map.accuracyFill}
                  strokeColor={theme.map.accuracyStroke}
                  strokeWidth={1}
                />
              )}
            <PlayerMarker
              fix={fix}
              direction={direction}
              mapHeading={mapHeading}
              reducedMotion={reducedMotion}
            />
          </>
        )}
      </MapView>
      <View
        pointerEvents="box-none"
        style={[
          styles.top,
          {
            top: insets.top + 10,
            left: Math.max(insets.left, 14),
            right: Math.max(insets.right, 14),
          },
        ]}
      >
        <ExplorerProfile xp={xp} count={Object.keys(journal).length} />
        <View style={styles.tools}>
          <MapButton
            label="Filtrer les périodes historiques"
            icon="layers-outline"
            active={periods.length !== historicalPeriods.length}
            onPress={() => setPanel("filters")}
          />
          <MapButton
            label="Options de la carte et localisation"
            icon="options-outline"
            onPress={() => setPanel("settings")}
          />
        </View>
      </View>
      {periods.length === 0 && (
        <View
          pointerEvents="none"
          style={[styles.filterHint, { top: insets.top + 86 }]}
        >
          <Text style={styles.hintText}>
            Aucune période affichée · modifiez les filtres
          </Text>
        </View>
      )}
      <View
        pointerEvents="box-none"
        style={[
          styles.controls,
          {
            bottom: bottom + (selected ? 150 : 10),
            right: Math.max(insets.right, 14),
          },
        ]}
      >
        <MapButton
          label="Orienter la carte vers le nord"
          icon="compass-outline"
          onPress={() => {
            stopFollowing();
            moveCamera({ heading: 0 });
          }}
        />
        <MapButton
          label={
            following && fresh
              ? "Recentrer sur mon explorateur"
              : "Recentrer et reprendre le suivi GPS"
          }
          icon={following && goodGPS ? "locate" : "locate-outline"}
          active={following && goodGPS}
          onPress={recenter}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${gps}. ${status}. Toucher pour ${!fix || !fresh ? "actualiser la localisation" : "voir les options"}.`}
        onPress={() => {
          if (storageError || (fix && fresh)) setPanel("settings");
          else recenter();
        }}
        style={[
          styles.status,
          {
            left: Math.max(insets.left, 14),
            bottom: bottom + (selected ? 150 : 10),
            maxWidth: "70%",
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            {
              backgroundColor:
                storageError || !goodGPS ? colors.violet : colors.turquoise,
            },
          ]}
        />
        <Text numberOfLines={1} style={styles.statusText}>
          {status}
        </Text>
        {(!fix || !fresh) && <Icon name="chevron-forward" size={12} />}
      </Pressable>
      {selected && (
        <View
          style={[
            styles.preview,
            {
              left: Math.max(insets.left, 14),
              right: Math.max(insets.right, 14),
              bottom,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir la fiche de ${selected.name}`}
            onPress={() => setSheetOpen(true)}
            style={styles.previewLink}
          >
            <Image source={selected.image} style={styles.photo} />
            <View style={styles.previewText}>
              <Text style={styles.era}>
                {selected.city} · {selected.era}
              </Text>
              <Text numberOfLines={2} style={styles.name}>
                {selected.name}
              </Text>
              <Text style={styles.distance}>
                {fresh
                  ? formatDistance(distance(fix, selected))
                  : "Position indisponible"}{" "}
                · {journal[selected.id] ? "Découvert ✓" : `+${selected.xp} XP`}
              </Text>
              <Text style={styles.read}>Consulter l’histoire →</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer le monument sélectionné"
            onPress={() => setSelection(null)}
            style={styles.close}
          >
            <Icon name="close" size={19} />
          </Pressable>
        </View>
      )}
      <MonumentBottomSheet
        monument={sheetOpen ? selected : null}
        close={closeSheet}
      />
      <MapOptions
        panel={panel}
        close={() => setPanel(null)}
        immersive={immersive}
        setImmersive={setPerspective}
        following={following}
        follow={recenter}
        periods={periods}
        setPeriods={setPeriods}
        browse={browse}
        gps={
          fresh ? gps : fix ? "Position trop ancienne · actualisez le GPS" : gps
        }
        accuracy={fix?.accuracy ?? null}
        directionAvailable={direction !== null}
        storageError={storageError}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.map.land },
  top: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  tools: { flexDirection: "row", gap: 8 },
  controls: { position: "absolute", gap: 9, alignItems: "flex-end" },
  status: {
    position: "absolute",
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: theme.surfaces.overlay,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  statusText: { color: colors.ink, fontSize: 11, flexShrink: 1 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  filterHint: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: theme.surfaces.overlay,
    padding: 10,
    borderRadius: 12,
  },
  hintText: { color: colors.ink, fontSize: 11 },
  preview: {
    position: "absolute",
    backgroundColor: theme.surfaces.overlay,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    minHeight: 112,
  },
  previewLink: { flexDirection: "row", gap: 12, paddingRight: 30 },
  photo: { width: 64, height: 94, borderRadius: 13 },
  previewText: { flex: 1, justifyContent: "center", gap: 6 },
  era: { color: colors.violet, fontSize: 9, letterSpacing: 0.6 },
  name: { color: colors.ink, fontWeight: "700", fontSize: 17, lineHeight: 21 },
  distance: { color: colors.muted, fontSize: 11 },
  read: { color: colors.violet, fontSize: 11, fontWeight: "600" },
  close: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
