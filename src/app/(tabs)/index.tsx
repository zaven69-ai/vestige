import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { City, monuments, cities, Monument } from "../../data/monuments";
import { useGame } from "../../lib/store";
import { distance, formatDistance, levelFor } from "../../lib/game";
import { colors, s, Icon } from "../../components/ui";
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#d9decf" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#526457" }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#96b8b4" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#f3f0e3" }],
  },
];
export default function Explorer() {
  const [cityChoice, setCity] = useState<City | null>(null),
    [selection, setSelected] = useState<Monument | null>(null);
  const { fix, gps, requestGPS, xp, journal, storageError } = useGame();
  const nearest = fix
    ? [...monuments].sort((a, b) => distance(fix, a) - distance(fix, b))[0]
    : null;
  const city =
    cityChoice ??
    (nearest && fix && distance(fix, nearest) < 50000
      ? nearest.city
      : "Vienne");
  const selected = selection ?? monuments.find((m) => m.city === city)!;
  const map = useRef<MapView>(null),
    centered = useRef(false);
  useEffect(() => {
    if (fix && !centered.current) {
      centered.current = true;
      map.current?.animateToRegion({
        ...fix,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });
    }
  }, [fix]);
  function changeCity(next: City) {
    setCity(next);
    setSelected(monuments.find((m) => m.city === next)!);
    map.current?.animateToRegion({
      ...cities[next],
      latitudeDelta: 0.017,
      longitudeDelta: 0.017,
    });
  }
  return (
    <View style={styles.root}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          ...cities.Vienne,
          latitudeDelta: 0.014,
          longitudeDelta: 0.014,
        }}
        customMapStyle={mapStyle}
        showsCompass={false}
        showsUserLocation={false}
        showsPointsOfInterests={false}
        pitchEnabled
        rotateEnabled
        onMapReady={() => {
          if (fix)
            map.current?.animateToRegion({
              ...fix,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            });
        }}
      >
        {monuments.map((m) => (
          <Marker
            key={m.id}
            coordinate={m}
            title={m.name}
            onPress={() => setSelected(m)}
            pinColor={
              journal[m.id]
                ? "#487b65"
                : selected.id === m.id
                  ? "#a65e32"
                  : "#867247"
            }
          />
        ))}
        <Circle
          center={selected}
          radius={100}
          fillColor="#b38a3e22"
          strokeColor="#a98146aa"
          strokeWidth={1}
        />
        {fix && (
          <>
            <Circle
              center={fix}
              radius={Math.min(fix.accuracy ?? 100, 500)}
              fillColor="#527eaa20"
              strokeColor="#527eaa60"
            />
            <Marker
              coordinate={fix}
              anchor={{ x: 0.5, y: 0.5 }}
              title="Votre position GPS"
            >
              <View style={styles.avatar}>
                <Icon name="navigate" color={colors.ink} size={19} />
              </View>
            </Marker>
          </>
        )}
      </MapView>
      <SafeAreaView
        edges={["top"]}
        pointerEvents="box-none"
        style={styles.overlay}
      >
        <View style={styles.header}>
          <View>
            <Text style={[s.eyebrow, { fontSize: 18, letterSpacing: 5 }]}>
              VESTIGE
            </Text>
            <Text style={styles.tagline}>L’histoire vous attend dehors.</Text>
          </View>
          <View style={styles.level}>
            <Icon name="sparkles-outline" size={16} />
            <Text style={{ color: colors.ink, fontWeight: "700" }}>
              Niv. {levelFor(xp)}
            </Text>
          </View>
        </View>
        <View style={styles.tools}>
          <View style={styles.citySwitch}>
            {(["Vienne", "Lyon"] as City[]).map((c) => (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityState={{ selected: city === c }}
                onPress={() => changeCity(c)}
                style={[
                  styles.city,
                  city === c && { backgroundColor: colors.gold },
                ]}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    color: city === c ? colors.bg : colors.ink,
                  }}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Activer le GPS et me recentrer"
            onPress={() => {
              if (fix)
                map.current?.animateToRegion({
                  ...fix,
                  latitudeDelta: 0.012,
                  longitudeDelta: 0.012,
                });
              else void requestGPS();
            }}
            style={styles.locate}
          >
            <Icon name="locate-outline" color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.status}>
          <View
            style={[
              styles.dot,
              { backgroundColor: fix ? colors.green : colors.gold },
            ]}
          />
          <Text style={{ color: colors.ink, fontSize: 11, flex: 1 }}>
            {gps}
            {fix ? ` · précision ±${Math.round(fix.accuracy ?? 0)} m` : ""}
          </Text>
          {!fix && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void requestGPS()}
            >
              <Text
                style={{ color: colors.gold, fontWeight: "700", fontSize: 11 }}
              >
                ACTIVER
              </Text>
            </Pressable>
          )}
        </View>
        {storageError && <Text style={styles.warning}>{storageError}</Text>}
      </SafeAreaView>
      <View style={styles.bottom}>
        <View style={styles.exploreLabel}>
          <Text style={styles.mapLabel}>✦ LE PASSÉ À PORTÉE DE PAS</Text>
          <Text style={styles.counter}>
            {monuments.filter((m) => m.city === city && journal[m.id]).length} /
            4 découverts
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Explorer ${selected.name}`}
          onPress={() =>
            router.push({
              pathname: "/monument/[id]",
              params: { id: selected.id },
            })
          }
          style={styles.feature}
        >
          <Image source={selected.image} style={styles.photo} />
          <View style={styles.featureText}>
            <Text style={s.eyebrow}>
              {selected.city} · {selected.era}
            </Text>
            <Text style={styles.featureTitle}>{selected.name}</Text>
            <Text style={s.body}>
              {fix
                ? formatDistance(distance(fix, selected))
                : "Activez le GPS pour la distance"}{" "}
              · {journal[selected.id] ? "Découvert ✓" : `+${selected.xp} XP`}
            </Text>
            <Text
              style={{ color: colors.gold, fontSize: 12, fontWeight: "700" }}
            >
              EXPLORER CE LIEU →
            </Text>
          </View>
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {monuments
            .filter((m) => m.city === city)
            .map((m) => (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                onPress={() => {
                  setSelected(m);
                  map.current?.animateToRegion({
                    ...m,
                    latitudeDelta: 0.006,
                    longitudeDelta: 0.006,
                  });
                }}
                style={[
                  styles.chip,
                  selected.id === m.id && { borderColor: colors.gold },
                ]}
              >
                <Text style={{ color: colors.ink, fontSize: 11 }}>
                  {journal[m.id] ? "✓ " : "⌖ "}
                  {m.name}
                </Text>
              </Pressable>
            ))}
        </ScrollView>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#d9decf" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
  },
  header: {
    backgroundColor: colors.bg,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  tagline: { color: colors.muted, fontSize: 10, marginTop: 5 },
  level: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    gap: 6,
  },
  tools: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  citySwitch: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    padding: 4,
    borderRadius: 14,
  },
  city: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 11 },
  locate: {
    backgroundColor: colors.bg,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  status: {
    backgroundColor: colors.bg,
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    gap: 8,
    borderRadius: 12,
    marginTop: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  warning: {
    color: colors.ink,
    backgroundColor: colors.bg,
    padding: 10,
    fontSize: 12,
  },
  bottom: { position: "absolute", bottom: 14, left: 16, right: 16, gap: 10 },
  exploreLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
    padding: 10,
    borderRadius: 10,
  },
  mapLabel: { color: colors.gold, fontSize: 9, letterSpacing: 1 },
  counter: { color: colors.muted, fontSize: 10 },
  feature: {
    backgroundColor: colors.bg,
    borderRadius: 22,
    padding: 10,
    flexDirection: "row",
    gap: 14,
  },
  photo: { width: 100, minHeight: 144, borderRadius: 15 },
  featureText: { flex: 1, paddingVertical: 8, gap: 9 },
  featureTitle: { fontFamily: "Georgia", color: colors.ink, fontSize: 23 },
  chip: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: "#376d80",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
