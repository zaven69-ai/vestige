import { RouteCompletionShare } from "../../components/community/RouteCompletionShare";
import { useMapCityPreference } from "../../hooks/useMapCityPreference";
import { miniaturePoiIds } from "../../lib/miniatures/assets";
import { MonumentMiniatureMarker } from "../../components/exploration/MonumentMiniatureMarker";
import { miniaturePlan } from "../../lib/miniatures/policy";
import { ExplorerAudioPlayer } from "../../components/live/ExplorerAudioPlayer";
import { useExplorationLocation } from "../../hooks/useExplorationLocation";
import { DeveloperControls } from "../../components/developer/DeveloperControls";
import { SimulationNotice } from "../../components/developer/SimulationBanner";
import {
  partitionGuidedPois,
  canPresentArrival,
} from "../../lib/navigation/explorer";
import { useExplorerGuidance } from "../../hooks/useExplorerGuidance";
import { ExplorerGuideHUD } from "../../components/navigation/ExplorerGuideHUD";
import { GuidedVisitFooter } from "../../components/navigation/GuidedVisitFooter";
import { useMapPlayer } from "../../hooks/useMapPlayer";
import { CatiaMapPreview } from "../../components/exploration/CatiaMapPreview";
import {
  PoiClusterMarker,
  type PoiGroup,
} from "../../components/exploration/PoiClusterMarker";
import {
  defaultPoiFilters,
  matchesPoi,
  poiCategories,
  poiStatuses,
} from "../../lib/poi";
import { PoiBadge } from "../../components/poi/PoiBadge";
import { MonumentPhoto } from "../../components/MonumentPhoto";
import { useLocalAtlas } from "../../hooks/useLocalAtlas";
import {
  clusterTarget,
  coincidentPois,
  viewportGroups,
  type PoiGroupingMode,
} from "../../lib/mapViewport";
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
  Alert,
} from "react-native";
import MapView, {
  Circle,
  LocalTile,
  Polyline,
  type Region,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { router, useIsFocused } from "expo-router";
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
const noMiniature = { enabled: false, size: 64 };
const initialCamera = {
  ...explorationCamera(cities.Lyon, true),
  altitude: 1400,
  zoom: 16,
};
export default function Explorer() {
  const { requestGPS, xp, journal, storageError } = useGame();
  const location = useExplorationLocation();
  const { fix, gps } = location;
  const [developerOpen, setDeveloperOpen] = useState(false);
  const cityPreference = useMapCityPreference();
  const restoredCity = useRef(false);
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const guidance = useExplorerGuidance(focused, location.position);
  const guideActive = guidance.active;
  const routeMonuments = useMemo(
    () =>
      guideActive
        ? guidance.tour.stops
            .map((stop) => monuments.find((m) => m.id === stop.poiId)!)
            .filter(Boolean)
        : [],
    [guideActive, guidance.tour],
  );
  const routeIds = useMemo(
    () => new Set(routeMonuments.map((m) => m.id)),
    [routeMonuments],
  );
  const now = useExplorationClock();
  const fresh = isFreshFix(fix, now);
  const mapPlayer = useMapPlayer();
  const [catiaAnimating, setCatiaAnimating] = useState(true);
  const [catiaPreview, setCatiaPreview] = useState(false);
  const previewVisible =
    !location.enabled &&
    mapPlayer.choice === "catia" &&
    (!fresh || catiaPreview);
  const heading = useExplorerHeading(focused && fresh && !location.enabled);
  const reducedMotion = useReducedMotion();
  const direction = location.enabled
    ? (fix?.heading ?? 0)
    : playerDirection(heading, fix, now);
  const { width, height } = useWindowDimensions();
  const [poiGrouping, setPoiGrouping] = useState<PoiGroupingMode>("individual");
  const [atlasEnabled, setAtlasEnabled] = useState(false);
  const atlas = useLocalAtlas(atlasEnabled);
  const [region, setRegion] = useState<Region>({
    ...cities.Lyon,
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
  const [miniaturesEnabled, setMiniaturesEnabled] = useState(true);
  const [panel, setPanel] = useState<"settings" | "filters" | "legend" | null>(
    null,
  );
  const [periods, setPeriods] = useState<HistoricalPeriod[]>([
    ...historicalPeriods,
  ]);
  const [poiFilters, setPoiFilters] = useState(defaultPoiFilters);
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
  const bottom = insets.bottom + 86 + (guidance.live.playback ? 130 : 0);
  const poiPartition = useMemo(
    () =>
      partitionGuidedPois(
        monuments,
        routeIds,
        (m) =>
          periods.includes(historicalPeriod(m.era)) &&
          matchesPoi(m, !!journal[m.id], poiFilters),
      ),
    [periods, journal, poiFilters, routeIds],
  );
  const visibleMonuments = poiPartition.visible;
  const miniaturePlans = useMemo(
    () =>
      Object.fromEntries(
        miniaturePoiIds.map((id) => [
          id,
          miniaturePlan(
            id,
            visibleMonuments,
            region,
            height,
            miniaturesEnabled,
            miniaturePoiIds,
          ),
        ]),
      ),
    [visibleMonuments, region, height, miniaturesEnabled],
  );
  const groups = useMemo(
    () =>
      viewportGroups(poiPartition.ordinary, region, width, height, poiGrouping),
    [poiPartition.ordinary, region, width, height, poiGrouping],
  );
  const routePins = useMemo(
    () => viewportGroups(routeMonuments, region, width, height, "individual"),
    [routeMonuments, region, width, height],
  );
  const selected =
    selection && visibleMonuments.some((m) => m.id === selection.id)
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
        map.current?.animateCamera(camera, {
          duration: location.enabled ? 250 : theme.motion.travel,
        });
    },
    [reducedMotion, location.enabled],
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
      !guideActive &&
      cameraFix.current &&
      initialFollow.current &&
      avatarMotion(cameraFix.current, fix, reducedMotion) === "hold"
    )
      return;
    cameraFix.current = fix;
    if (!initialFollow.current) {
      initialFollow.current = true;
      cameraFix.current = fix;
      moveCamera({
        ...explorationCamera(fix, immersive),
        ...(guideActive
          ? {
              altitude: 400,
              zoom: 18,
              heading: location.enabled ? 0 : (direction ?? 0),
            }
          : {}),
      });
    } else
      moveCamera({
        center: { latitude: fix.latitude, longitude: fix.longitude },
        ...(guideActive && !location.enabled && direction !== null
          ? { heading: direction }
          : {}),
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
    guideActive,
    direction,
    location.enabled,
  ]);
  useEffect(() => {
    if (!mapReady || !cityPreference.ready || restoredCity.current) return;
    restoredCity.current = true;
    if (!fresh)
      moveCamera({
        ...explorationCamera(cities[cityPreference.city], true),
        altitude: 1400,
        zoom: 16,
      });
  }, [mapReady, cityPreference.ready, cityPreference.city, fresh, moveCamera]);
  const recenter = () => {
    followingRef.current = true;
    setFollowing(true);
    setSelection(null);
    initialFollow.current = false;
    if (fresh && goodGPS) {
      initialFollow.current = true;
      cameraFix.current = fix;
      moveCamera({
        ...explorationCamera(fix, immersive),
        ...(guideActive
          ? {
              altitude: 400,
              zoom: 18,
              heading: location.enabled ? 0 : (direction ?? 0),
            }
          : {}),
      });
    } else void requestGPS();
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      followingRef.current = true;
      initialFollow.current = false;
      cameraFix.current = null;
      setFollowing(true);
      setSelection(null);
      setSheetOpen(false);
      arrivalsSeen.current.clear();
    }, 0);
    return () => clearTimeout(timer);
  }, [location.epoch]);
  const guidedSheetKey = useRef<string | null>(null);
  const arrivalsSeen = useRef(new Set<string>());
  const openGuidedStage = useCallback(() => {
    guidedSheetKey.current = guidance.stageKey;
    setSelection(guidance.monument);
    setSheetOpen(true);
  }, [guidance.stageKey, guidance.monument]);
  useEffect(() => {
    if (
      !canPresentArrival({
        stageKey: guidance.stageKey,
        seen: arrivalsSeen.current,
        active: guideActive,
        focused,
        arrived: guidance.navigation.arrived,
        blocked: sheetOpen || panel !== null || developerOpen,
      })
    )
      return;
    const timer = setTimeout(() => {
      arrivalsSeen.current.add(guidance.stageKey);
      openGuidedStage();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    guideActive,
    focused,
    guidance.navigation.arrived,
    guidance.stageKey,
    sheetOpen,
    panel,
    developerOpen,
    openGuidedStage,
  ]);
  useEffect(() => {
    if (!guidedSheetKey.current || guidedSheetKey.current === guidance.stageKey)
      return;
    guidedSheetKey.current = null;
    const timer = setTimeout(() => {
      setSheetOpen(false);
      setSelection(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [guidance.stageKey]);
  useEffect(() => {
    if (!guideActive || !guidance.navigation.enabled) return;
    const timer = setTimeout(() => {
      followingRef.current = true;
      setFollowing(true);
      initialFollow.current = false;
    }, 0);
    return () => clearTimeout(timer);
  }, [guideActive, guidance.navigation.enabled]);
  const overviewRoute = () => {
    const points = guidance.navigation.route?.coordinates ?? routeMonuments;
    stopFollowing();
    if (points.length)
      map.current?.fitToCoordinates(points, {
        edgePadding: { top: 180, bottom: 140, left: 40, right: 40 },
        animated: !reducedMotion,
      });
  };
  const selectMonument = useCallback(
    (monument: Monument) => {
      stopFollowing();
      setSelection(monument);
    },
    [stopFollowing],
  );
  const openMiniature = useCallback(
    (monument: Monument) => {
      stopFollowing();
      setSelection(monument);
      setSheetOpen(true);
    },
    [stopFollowing],
  );
  const selectMapMonument = useCallback(
    (monument: Monument) => {
      const choices = coincidentPois(monument, visibleMonuments);
      if (choices.length > 1) {
        stopFollowing();
        setClusterChoices(choices);
      } else selectMonument(monument);
    },
    [visibleMonuments, stopFollowing, selectMonument],
  );
  const selectCluster = useCallback(
    (group: PoiGroup) => {
      stopFollowing();
      const target = clusterTarget(group.members);
      if (!target) setClusterChoices(group.members);
      else map.current?.animateToRegion(target, reducedMotion ? 0 : 350);
    },
    [stopFollowing, reducedMotion],
  );
  const browse = (city: City) => {
    cityPreference.save(city);
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
  const status = location.enabled
    ? "Test · aucune récompense réelle"
    : storageError
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
      {focused && <StatusBar style="light" />}
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
            <SimulationNotice />
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
        userInterfaceStyle="dark"
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
        onLongPress={(event) => {
          if (!__DEV__ || !location.controller.isEnabled()) return;
          const point = event.nativeEvent.coordinate;
          Alert.alert(
            "Téléporter Catia ici ?",
            "Mode test uniquement. Aucun XP ni visite sauvegardée.",
            [
              { text: "Annuler", style: "cancel" },
              {
                text: "Téléporter",
                onPress: () => {
                  if (!location.controller.teleportTo(point)) return;
                  followingRef.current = true;
                  initialFollow.current = false;
                  setFollowing(true);
                  setSelection(null);
                  setSheetOpen(false);
                  moveCamera({ center: point });
                },
              },
            ],
          );
        }}
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
        onPress={(event) => {
          if (event.nativeEvent.action !== "marker-press") setSelection(null);
        }}
      >
        {atlasActive && atlas.path && (
          <LocalTile pathTemplate={atlas.path} tileSize={256} zIndex={0} />
        )}
        {guideActive && guidance.navigation.route && (
          <>
            <Polyline
              coordinates={guidance.navigation.route.coordinates}
              strokeColor="#07152C"
              strokeWidth={10}
              zIndex={1}
            />
            <Polyline
              coordinates={guidance.navigation.route.coordinates}
              strokeColor="#E8CD8E"
              strokeWidth={5}
              zIndex={2}
            />
          </>
        )}
        {routePins.map((group) => (
          <MonumentMiniatureMarker
            key={`route-${group.key}`}
            monument={group.members[0]}
            state={monumentState(
              group.members[0],
              !!journal[group.members[0].id],
              fix,
              now,
            )}
            selected={
              selected?.id === group.members[0].id ||
              guidance.stop.poiId === group.members[0].id
            }
            onSelect={selectMapMonument}
            reducedMotion={reducedMotion}
            mapHeading={mapHeading}
            plan={miniaturePlans[group.members[0].id] ?? noMiniature}
            onOpenMiniature={openMiniature}
          />
        ))}
        {groups.map((group) =>
          group.members.length === 1 ? (
            <MonumentMiniatureMarker
              key={group.members[0].id}
              monument={group.members[0]}
              state={monumentState(
                group.members[0],
                !!journal[group.members[0].id],
                fix,
                now,
              )}
              selected={selected?.id === group.members[0].id}
              onSelect={selectMapMonument}
              reducedMotion={reducedMotion}
              mapHeading={mapHeading}
              plan={miniaturePlans[group.members[0].id] ?? noMiniature}
              onOpenMiniature={openMiniature}
            />
          ) : (
            <PoiClusterMarker
              key={group.key}
              group={group}
              onSelect={selectCluster}
            />
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
            {!previewVisible && (
              <PlayerMarker
                key={
                  location.enabled
                    ? `preview:${location.epoch}:${location.teleport}`
                    : "device"
                }
                simulated={location.enabled}
                character={location.enabled ? "catia" : mapPlayer.choice}
                animate={catiaAnimating}
                fix={fix}
                direction={direction}
                mapHeading={mapHeading}
                active={focused && !sheetOpen && panel === null}
                reducedMotion={reducedMotion}
              />
            )}
          </>
        )}
      </MapView>
      {previewVisible && (
        <CatiaMapPreview
          active={focused && !sheetOpen && panel === null && catiaAnimating}
          reducedMotion={reducedMotion}
        />
      )}
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
            top: insets.top + (location.enabled ? 50 : 10),
            left: Math.max(insets.left, 14),
            right: Math.max(insets.right, 14),
          },
        ]}
      >
        {!guideActive && (
          <ExplorerProfile xp={xp} count={Object.keys(journal).length} />
        )}
        {!guideActive && (
          <View style={styles.tools}>
            <MapButton
              label="Filtrer les lieux : époque, catégorie, contrôle et visites"
              icon="layers-outline"
              active={
                periods.length !== historicalPeriods.length ||
                poiFilters.categories.length !== poiCategories.length ||
                poiFilters.statuses.length !== poiStatuses.length ||
                poiFilters.visits !== "all"
              }
              onPress={() => setPanel("filters")}
            />
            <MapButton
              label="Options de la carte et localisation"
              icon="options-outline"
              onPress={() => setPanel("settings")}
            />
          </View>
        )}
      </View>
      {guideActive && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top + (location.enabled ? 50 : 10),
            left: 14,
            right: 14,
          }}
        >
          <ExplorerGuideHUD
            guide={guidance}
            onOpenStage={openGuidedStage}
            onOverview={overviewRoute}
            onMapOptions={() => setPanel("settings")}
            onFilters={() => setPanel("filters")}
            onContribute={() => router.push("/contribuer")}
            onLegend={() => setPanel("legend")}
          />
        </View>
      )}
      {!guideActive && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setPanel("legend")}
          style={[
            styles.filterHint,
            {
              top: insets.top + (location.enabled ? 118 : 78),
              left: 14,
              alignSelf: "flex-start",
              minHeight: 44,
              justifyContent: "center",
            },
          ]}
        >
          <Text style={styles.hintText}>ⓘ Comprendre les marqueurs</Text>
        </Pressable>
      )}
      {!guideActive && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/contribuer")}
          style={[
            styles.filterHint,
            {
              top: insets.top + (location.enabled ? 168 : 128),
              left: 14,
              minHeight: 44,
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#D8BE80",
              paddingHorizontal: 18,
            },
          ]}
        >
          <Text style={{ color: "#F0DCAB", fontWeight: "700" }}>
            + Contribuer
          </Text>
        </Pressable>
      )}
      {visibleMonuments.length === 0 && (
        <View
          pointerEvents="none"
          style={[
            styles.filterHint,
            { top: insets.top + (location.enabled ? 222 : 182) },
          ]}
        >
          <Text style={styles.hintText}>
            Aucun lieu ne correspond · modifiez les filtres
          </Text>
        </View>
      )}
      <View
        pointerEvents="box-none"
        style={[
          styles.controls,
          {
            bottom: bottom + (selected ? 220 : 10),
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
      {!guideActive && (
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
              bottom: bottom + (selected ? 220 : 10),
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
      )}
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
              <PoiBadge poi={selected} compact />
              <Text style={styles.distance}>
                {fresh
                  ? formatDistance(distance(fix, selected))
                  : "Position indisponible"}{" "}
                ·{" "}
                {location.enabled
                  ? "Test · aucun XP"
                  : journal[selected.id]
                    ? "Découvert ✓"
                    : `+${selected.xp} XP`}
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
        footer={
          guideActive && selected?.id === guidance.stop.poiId ? (
            <GuidedVisitFooter
              key={guidance.stageKey}
              guide={guidance}
              onListen={() => {
                closeSheet();
                setSelection(null);
              }}
              onNext={() => {
                closeSheet();
                setSelection(null);
                guidance.live.advance("consulted");
              }}
            />
          ) : undefined
        }
      />
      {__DEV__ && (
        <>
          {!selected && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le mode développeur de localisation"
              onPress={() => setDeveloperOpen(true)}
              style={{
                position: "absolute",
                bottom:
                  bottom +
                  (selected ? 220 : 10) +
                  (location.enabled ? 175 : 50),
                left: 16,
                borderRadius: 12,
                padding: 12,
                backgroundColor: "#14253F",
                borderWidth: 1,
                borderColor: "#D8BE80",
              }}
            >
              <Text style={{ color: "#F2D99E", fontSize: 12 }}>
                Développeur
              </Text>
            </Pressable>
          )}
          <DeveloperControls
            open={developerOpen}
            close={() => setDeveloperOpen(false)}
            active={
              focused &&
              !sheetOpen &&
              !selected &&
              panel === null &&
              !clusterChoices.length
            }
            mapHeading={mapHeading}
            bottom={bottom + (selected ? 220 : 10) + 55}
            onTeleport={(point) => {
              followingRef.current = true;
              initialFollow.current = false;
              setFollowing(true);
              setSelection(null);
              setSheetOpen(false);
              moveCamera({
                ...explorationCamera(point, immersive),
                heading: 0,
              });
            }}
            onReturnGPS={() => {
              followingRef.current = true;
              initialFollow.current = false;
              cameraFix.current = null;
              setFollowing(true);
              void requestGPS();
            }}
          />
        </>
      )}
      {!guideActive && !selected && <RouteCompletionShare bottom={bottom + 56} />}
      <ExplorerAudioPlayer />
      <MapOptions
        miniaturesEnabled={miniaturesEnabled}
        setMiniaturesEnabled={setMiniaturesEnabled}
        onDeveloper={() => {
          setPanel(null);
          setDeveloperOpen(true);
        }}
        atlasEnabled={atlasEnabled}
        setAtlasEnabled={setAtlasEnabled}
        atlasStatus={atlas.status}
        panel={panel}
        poiFilters={poiFilters}
        setPoiFilters={setPoiFilters}
        visibleCount={visibleMonuments.length}
        mapPlayer={mapPlayer.choice}
        mapPlayerReady={mapPlayer.ready}
        mapPlayerError={mapPlayer.error}
        setMapPlayer={mapPlayer.save}
        catiaAnimating={catiaAnimating}
        setCatiaAnimating={setCatiaAnimating}
        catiaPreview={catiaPreview}
        setCatiaPreview={setCatiaPreview}
        hasFreshGPS={fresh}
        poiGrouping={poiGrouping}
        setPoiGrouping={setPoiGrouping}
        individualCount={
          groups.filter((group) => group.members.length === 1).length +
          routePins.length
        }
        clusterCount={groups.filter((group) => group.members.length > 1).length}
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
