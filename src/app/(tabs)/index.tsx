import { MonumentPhoto } from "../../components/MonumentPhoto";
import { useLocalAtlas } from "../../hooks/useLocalAtlas";
import { viewportGroups } from "../../lib/mapViewport";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Linking,
  Modal,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import MapView, {
  Circle,
  LocalTile,
  Marker,
  type Region,
} from "react-native-maps";
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
  const { width, height } = useWindowDimensions();
  const [atlasEnabled, setAtlasEnabled] = useState(true);
  const atlas = useLocalAtlas(atlasEnabled);
  const [region, setRegion] = useState<Region>({
    ...cities.Vienne,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  });
  const atlasActive =
    atlasEnabled &&
    !!atlas.path &&
    region.latitude - region.latitudeDelta / 2 >= atlas.bounds.south &&
    region.latitude + region.latitudeDelta / 2 <= atlas.bounds.north &&
    region.longitude - region.longitudeDelta / 2 >= atlas.bounds.west &&
    region.longitude + region.longitudeDelta / 2 <= atlas.bounds.east;
  const [following, setFollowing] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapHeading, setMapHeading] = useState(0);
  const [immersive, setImmersive] = useState(true);
  const [panel, setPanel] = useState<"settings" | "filters" | null>(null);
  const [periods, setPeriods] = useState<HistoricalPeriod[]>([
    ...historicalPeriods,
  ]);
  const [clusterChoices, setClusterChoices] = useState<Monument[]>([]);
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
  const visibleMonuments = useMemo(
    () => monuments.filter((m) => periods.includes(historicalPeriod(m.era))),
    [periods],
  );
  const groups = useMemo(
    () => viewportGroups(visibleMonuments, region, width, height),
    [visibleMonuments, region, width, height],
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
      <Modal
        visible={clusterChoices.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setClusterChoices([])}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#0009",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              maxHeight: "75%",
              backgroundColor: colors.bg,
              padding: 20,
              borderRadius: 24,
            }}
          >
            <Text
              style={{
                color: colors.ink,
                fontSize: 20,
                fontWeight: "700",
                marginBottom: 16,
              }}
            >
              Lieux voisins
            </Text>
            <ScrollView>
              {clusterChoices.map((m) => (
                <Pressable
                  accessibilityRole="button"
                  key={m.id}
                  onPress={() => {
                    setClusterChoices([]);
                    selectMonument(m);
                  }}
                  style={{ paddingVertical: 16 }}
                >
                  <Text style={{ color: colors.ink }}>{m.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer les lieux voisins"
              onPress={() => setClusterChoices([])}
              style={{ padding: 16 }}
            >
              <Text style={{ color: colors.turquoise }}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
        maxZoomLevel={atlasActive ? 18 : 20}
        showsBuildings={!atlasActive}
        showsIndoors={false}
        pitchEnabled
        rotateEnabled
        moveOnMarkerPress={false}
        onMapReady={() => setMapReady(true)}
        onPanDrag={stopFollowing}
        onRegionChange={() => readCameraHeading()}
        onRegionChangeComplete={(next) => {
          setRegion(next);
          readCameraHeading(true);
        }}
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
        {atlasActive && atlas.path && (
          <LocalTile pathTemplate={atlas.path} tileSize={256} zIndex={0} />
        )}
        {groups.map((group) =>
          group.members.length === 1 ? (
            <HistoricalMarker
              key={group.members[0].id}
              monument={group.members[0]}
              state={monumentState(
                group.members[0],
                !!journal[group.members[0].id],
                fix,
                now,
              )}
              selected={selected?.id === group.members[0].id}
              onSelect={selectMonument}
            />
          ) : (
            <Marker
              key={group.key}
              coordinate={{
                latitude: group.latitude,
                longitude: group.longitude,
              }}
              stopPropagation
              accessibilityLabel={`${group.members.length} lieux historiques. Agrandir la carte.`}
              onPress={(event) => {
                event.stopPropagation();
                stopFollowing();
                if (region.latitudeDelta < 0.001)
                  setClusterChoices(group.members);
                else
                  map.current?.animateToRegion(
                    {
                      latitude: group.latitude,
                      longitude: group.longitude,
                      latitudeDelta: region.latitudeDelta / 2,
                      longitudeDelta: region.longitudeDelta / 2,
                    },
                    reducedMotion ? 0 : 350,
                  );
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.violet,
                  borderWidth: 3,
                  borderColor: colors.turquoise,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "800" }}>
                  {group.members.length}
                </Text>
              </View>
            </Marker>
          ),
        )}
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
              active={focused && !sheetOpen && panel === null}
              reducedMotion={reducedMotion}
            />
          </>
        )}
      </MapView>
      <Pressable
        onPress={() => {
          void Linking.openURL("https://www.openstreetmap.org/copyright").catch(
            () => {},
          );
        }}
        style={{
          position: "absolute",
          bottom: bottom - 18,
          left: 14,
          backgroundColor: "#ffffffdd",
          borderRadius: 6,
          padding: 3,
        }}
      >
        <Text style={{ fontSize: 10, color: "#26304a" }}>
          {atlasActive ? "Atlas VESTIGE · " : ""}© OpenStreetMap · ODbL
        </Text>
      </Pressable>
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
            <MonumentPhoto monument={selected} style={styles.photo} />
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
        atlasEnabled={atlasEnabled}
        setAtlasEnabled={setAtlasEnabled}
        atlasStatus={atlas.status}
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
