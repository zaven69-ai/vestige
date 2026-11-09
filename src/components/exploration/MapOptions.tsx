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
import {
  historicalPeriods,
  type HistoricalPeriod,
} from "../../lib/exploration";
import type { City } from "../../data/monuments";
type Props = {
  panel: "settings" | "filters" | null;
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
  panel,
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
  return (
    <Modal
      visible={panel !== null}
      transparent
      animationType="slide"
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
              {panel === "filters" ? "Les strates du temps" : "Votre boussole"}
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
            {panel === "filters" ? (
              <>
                <Text style={s.body}>
                  Choisissez les périodes visibles sur la carte. Les lieux
                  masqués restent accessibles dans les parcours et le carnet.
                </Text>
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
                  title="Afficher toutes les périodes"
                  secondary
                  onPress={() => setPeriods([...historicalPeriods])}
                />
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
                    trackColor={{ true: "#60866a", false: colors.line }}
                    thumbColor={colors.gold}
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
                <Text style={s.eyebrow}>Explorer une ville</Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {(["Vienne", "Lyon"] as City[]).map((city) => (
                    <View key={city} style={{ flex: 1 }}>
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
  root: { flex: 1, backgroundColor: "#07151477", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
    gap: 12,
    minHeight: 48,
  },
  option: { color: colors.ink, fontSize: 15, fontWeight: "600" },
});
