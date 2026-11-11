import type { PoiGroupingMode } from "../../lib/mapViewport";
import { POI_MAP_RENDERER } from "../../lib/poiMapRendering";
import { PoiFilterPanel, PoiLegend } from "../poi/PoiControls";
import { defaultPoiFilters, type PoiFilters } from "../../lib/poi";
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Icon, colors, s } from "../ui";
import { theme } from "../../theme";
import { useReducedMotion } from "../../hooks/useExplorerSensors";
import {
  historicalPeriods,
  type HistoricalPeriod,
} from "../../lib/exploration";
import { cities, type City } from "../../data/monuments";
type Props = {
  atlasEnabled: boolean;
  setAtlasEnabled: (value: boolean) => void;
  atlasStatus: string;
  panel: "settings" | "filters" | "legend" | null;
  poiFilters: PoiFilters;
  setPoiFilters: (filters: PoiFilters) => void;
  visibleCount: number;
  poiGrouping: PoiGroupingMode;
  setPoiGrouping: (mode: PoiGroupingMode) => void;
  individualCount: number;
  clusterCount: number;
  close: () => void;
  immersive: boolean;
  setImmersive: (value: boolean) => void;
  following: boolean;
  follow: () => void;
  periods: HistoricalPeriod[];
  setPeriods: (periods: HistoricalPeriod[]) => void;
  browse: (city: City) => void;
  gps: string;
  accuracy: number | null;
  directionAvailable: boolean;
  storageError: string | null;
};
export function MapOptions({
  atlasEnabled,
  setAtlasEnabled,
  atlasStatus,
  panel,
  poiFilters,
  setPoiFilters,
  visibleCount,
  poiGrouping,
  setPoiGrouping,
  individualCount,
  clusterCount,
  close,
  immersive,
  setImmersive,
  following,
  follow,
  periods,
  setPeriods,
  browse,
  gps,
  accuracy,
  directionAvailable,
  storageError,
}: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  return (
    <Modal
      visible={panel !== null}
      transparent
      animationType={reduced ? "none" : "slide"}
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer les options de la carte"
          style={StyleSheet.absoluteFill}
          onPress={close}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 18), maxHeight: "80%" },
          ]}
        >
          <View style={styles.header}>
            <Text style={s.heading}>
              {panel === "legend"
                ? "Comprendre les marqueurs"
                : panel === "filters"
                  ? "Affiner l’exploration"
                  : "Votre boussole"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={styles.close}
              onPress={close}
            >
              <Icon name="close" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 10 }}>
            {panel === "legend" ? (
              <PoiLegend />
            ) : panel === "filters" ? (
              <>
                <Text style={s.body}>
                  Choisissez les périodes visibles sur la carte. Les lieux
                  masqués restent accessibles dans les parcours et le carnet.
                </Text>
                <Text style={s.heading}>
                  {visibleCount} lieux correspondent · toutes villes
                </Text>
                <Text style={s.eyebrow}>Époque</Text>
                {historicalPeriods.map((period) => (
                  <Pressable
                    key={period}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: periods.includes(period) }}
                    onPress={() =>
                      setPeriods(
                        periods.includes(period)
                          ? periods.filter((p) => p !== period)
                          : [...periods, period],
                      )
                    }
                    style={styles.row}
                  >
                    <Text style={styles.option}>{period}</Text>
                    <Icon
                      name={
                        periods.includes(period) ? "checkbox" : "square-outline"
                      }
                    />
                  </Pressable>
                ))}
                <Button
                  title="Réinitialiser tous les filtres"
                  secondary
                  onPress={() => {
                    setPeriods([...historicalPeriods]);
                    setPoiFilters(defaultPoiFilters());
                  }}
                />
                <PoiFilterPanel filters={poiFilters} onChange={setPoiFilters} />
              </>
            ) : (
              <>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.option}>Perspective immersive</Text>
                    <Text style={s.body}>
                      Inclinaison native à 45°, selon le fond de carte.
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel="Perspective immersive"
                    value={immersive}
                    onValueChange={setImmersive}
                    trackColor={{ true: colors.turquoise, false: colors.line }}
                    thumbColor={colors.violet}
                  />
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.option}>
                      Atlas local · Vienne (clair, hors ligne)
                    </Text>
                    <Text style={s.body}>{atlasStatus}</Text>
                  </View>
                  <Switch
                    accessibilityLabel="Atlas VESTIGE"
                    value={atlasEnabled}
                    onValueChange={setAtlasEnabled}
                  />
                </View>
                <Button
                  title={
                    following
                      ? "Recentrer sur mon explorateur"
                      : "Reprendre le suivi GPS"
                  }
                  secondary
                  onPress={() => {
                    close();
                    follow();
                  }}
                />
                <View style={s.card}>
                  <Text style={s.eyebrow}>Rendu des lieux</Text>
                  <Text selectable style={s.body}>
                    {POI_MAP_RENDERER}
                  </Text>
                  <Text style={s.body}>
                    {individualCount} lieux individuels · {clusterCount}{" "}
                    regroupements dans la zone affichée.
                  </Text>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.option}>POI individuels</Text>
                      <Text style={s.caption}>
                        Désactiver tous les regroupements, même à distance.
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel="Afficher tous les POI individuellement"
                      value={poiGrouping === "individual"}
                      onValueChange={(value) =>
                        setPoiGrouping(value ? "individual" : "auto")
                      }
                    />
                  </View>
                  <Text style={s.caption}>
                    En vue ville et rue, chaque lieu est individuel. Les
                    illustrations mesurent 64 × 72 points. Les cercles « lieux »
                    sont des regroupements : touchez-les pour agrandir ou
                    choisir un lieu.
                  </Text>
                </View>
                <Text style={s.eyebrow}>Explorer une ville</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: theme.space.sm,
                  }}
                >
                  {(Object.keys(cities) as City[]).map((city) => (
                    <View
                      key={city}
                      style={{ flexGrow: 1, minWidth: 140, width: "45%" }}
                    >
                      <Button
                        title={city}
                        secondary
                        onPress={() => {
                          close();
                          browse(city);
                        }}
                      />
                    </View>
                  ))}
                </View>
                <Text style={s.body}>
                  Changer de ville déplace uniquement la carte. Votre
                  explorateur reste à sa vraie position GPS.
                </Text>
                <View style={s.card}>
                  <Text style={s.eyebrow}>Réception GPS</Text>
                  <Text style={s.body}>
                    {gps}
                    {accuracy !== null
                      ? ` · précision ±${Math.round(accuracy)} m`
                      : ""}
                  </Text>
                  <Text style={s.body}>
                    {directionAvailable
                      ? "Direction disponible via un cap suffisamment fiable."
                      : "Cap indisponible ou imprécis : aucune direction inventée."}
                  </Text>
                  <Text style={s.body}>
                    Localisation au premier plan uniquement. Le capteur de
                    direction est arrêté lorsque vous quittez Explorer. Les
                    validations utilisent toujours les coordonnées GPS brutes.
                  </Text>
                </View>
                <Button
                  title="Réglages de localisation du téléphone ↗"
                  secondary
                  onPress={() => {
                    void Linking.openSettings().catch(() =>
                      Alert.alert(
                        "Réglages indisponibles",
                        "Ouvrez les réglages du téléphone pour vérifier les permissions.",
                      ),
                    );
                  }}
                />
                {storageError && (
                  <Text accessibilityRole="alert" style={s.body}>
                    {storageError}
                  </Text>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.space.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.space.sm,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space.sm,
    minHeight: 48,
  },
  option: { color: colors.ink, fontSize: 15, fontWeight: "600" },
});
