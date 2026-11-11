import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  ScrollView,
} from "react-native";
import type { ExplorerGuidance } from "../../hooks/useExplorerGuidance";
import { formatDistance } from "../../lib/game";
import {
  formatWalkingTime,
  phoneNavigationURL,
} from "../../lib/navigation/walking";
import { Icon } from "../ui";
export function ExplorerGuideHUD({
  guide,
  onOpenStage,
  onOverview,
  onMapOptions,
  onFilters,
  onContribute,
  onLegend,
}: {
  guide: ExplorerGuidance;
  onOpenStage: () => void;
  onOverview: () => void;
  onMapOptions: () => void;
  onFilters: () => void;
  onContribute: () => void;
  onLegend: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { navigation: n, live, tour, session, monument } = guide;
  if (!session || !guide.active) return null;
  const instruction = !n.enabled
    ? "Votre prochaine exploration vous attend"
    : session.paused
      ? "Parcours en pause"
      : n.status === "gps"
        ? "GPS précis nécessaire pour guider"
        : n.status === "loading"
          ? "Calcul du chemin piéton…"
          : n.error
            ? "Trajet indisponible · détails"
            : n.arrived
              ? "Vous êtes près du monument"
              : n.offRoute
                ? "Hors trajet · vérification GPS"
                : n.progress
                  ? n.progress.nextInstruction
                    ? `Dans ${formatDistance(n.progress.metersToTurn)} : ${n.progress.nextInstruction}`
                    : n.progress.instruction
                  : "En attente du chemin piéton";
  const metrics =
    n.status === "ready" && n.progress && !n.offRoute
      ? `${formatDistance(n.progress.remainingMeters)} · ${formatWalkingTime(n.progress.remainingSeconds)}`
      : n.enabled
        ? "Valhalla · itinéraire piéton réel"
        : "Reprendre le guidage";
  function quit() {
    Alert.alert(
      "Quitter le guidage ?",
      live.preview
        ? "Démonstration éphémère : aucune progression réelle enregistrée."
        : "La progression de visite est conservée. Les XP et le carnet ne changent pas.",
      [
        { text: "Continuer", style: "cancel" },
        {
          text: "Quitter",
          onPress: () => {
            n.stop();
            live.leave();
          },
        },
      ],
    );
  }
  function auto() {
    if (live.mode === "automatic") {
      live.setMode("manual");
      return;
    }
    Alert.alert(
      "Narrations automatiques ?",
      "Application ouverte, GPS précis, approche confirmée. Seuls les textes relus avec un fichier audio approuvé sont éligibles.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Activer", onPress: () => live.setMode("automatic") },
      ],
    );
  }
  return (
    <View style={styles.shell}>
      <View style={styles.row}>
        <Text numberOfLines={1} style={styles.kicker}>
          {live.preview ? "TEST · " : ""}
          {tour.title} · {session.index + 1}/{tour.stops.length}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quitter le guidage du parcours"
          onPress={quit}
          style={styles.icon}
        >
          <Icon name="close" size={19} color="#E8CD8E" />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ouvrir l’étape ${monument.name}`}
        onPress={onOpenStage}
      >
        <Text numberOfLines={1} style={styles.name}>
          {monument.name}
        </Text>
      </Pressable>
      <Text
        accessibilityLiveRegion="polite"
        numberOfLines={2}
        style={styles.direction}
      >
        {instruction}
      </Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={n.enabled ? onOpenStage : n.start}
          style={styles.action}
        >
          <Text style={styles.metrics}>{metrics}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Options du guidage"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((v) => !v)}
          style={styles.action}
        >
          <Text style={styles.metrics}>{expanded ? "Réduire" : "Options"}</Text>
        </Pressable>
      </View>
      {expanded && (
        <ScrollView
          style={{ maxHeight: 240 }}
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        >
          {n.error && <Text style={styles.note}>{n.error}</Text>}
          {live.storageError && (
            <Text style={styles.note}>{live.storageError}</Text>
          )}
          <Text style={styles.note}>
            Le calcul transmet le départ {live.preview ? "simulé" : "GPS"} et
            l’étape au service public Valhalla/FOSSGIS. Aucun trajet fictif en
            cas d’échec.
          </Text>
          {!n.enabled && (
            <Action text="Démarrer le guidage à pied" onPress={n.start} />
          )}
          <Action
            text={
              session.paused
                ? "Reprendre le parcours"
                : "Mettre le parcours en pause"
            }
            onPress={live.togglePause}
          />
          <Action
            text={`Narration : ${live.mode === "manual" ? "manuelle" : "automatique"}`}
            onPress={auto}
          />
          <Action
            text="Recalculer le chemin"
            onPress={n.retry}
            disabled={
              !n.valid ||
              !n.enabled ||
              n.status === "loading" ||
              n.status === "paused"
            }
          />
          <Action text="Voir tout le trajet" onPress={onOverview} />
          <Action text="Options de la carte" onPress={onMapOptions} />
          <Action text="Filtrer les POI" onPress={onFilters} />
          <Action text="Légende des POI" onPress={onLegend} />
          <Action text="Contribuer" onPress={onContribute} />
          <Action text="Lire la fiche et la narration" onPress={onOpenStage} />
          <Action
            text="Passer cette étape"
            onPress={() => live.advance("skipped")}
            disabled={session.paused || !!live.storageError}
          />
          <Action
            text="Plans / Maps en voiture"
            onPress={() =>
              void Linking.openURL(
                phoneNavigationURL(guide.stop.approach, Platform.OS),
              ).catch(() => Alert.alert("Navigation indisponible"))
            }
          />
          <Text style={styles.note}>
            Premier plan · audio uniquement si approuvé · aucun XP par simple
            guidage.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
function Action({
  text,
  onPress,
  disabled = false,
}: {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={{
        padding: 10,
        minHeight: 44,
        opacity: disabled ? 0.45 : 1,
        backgroundColor: "#102540",
        borderRadius: 10,
      }}
    >
      <Text style={{ color: "#E7D2A1", fontSize: 13 }}>{text}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  shell: {
    backgroundColor: "#04132AF5",
    borderWidth: 1,
    borderColor: "#B89B5E",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  kicker: { color: "#C5AD77", fontSize: 11, fontWeight: "700", flex: 1 },
  name: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  direction: { color: "#F5E4BE", fontSize: 14, lineHeight: 18, marginTop: 4 },
  metrics: { color: "#69CED0", fontSize: 12, fontWeight: "600" },
  action: { minHeight: 34, justifyContent: "center" },
  icon: {
    minWidth: 36,
    minHeight: 30,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  note: { color: "#AFBED2", fontSize: 12, lineHeight: 17 },
});
