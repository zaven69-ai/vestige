import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Platform, Share, Text, View } from "react-native";
import type { Monument } from "../../data/monuments";
import { Button, s } from "../ui";
import { communityStore } from "../../lib/contributions/native";
import { publicShare } from "../../lib/contributions/share";
export function MonumentActions({
  monument,
  contribute,
  report,
}: {
  monument: Monument;
  contribute: () => void;
  report: () => void;
}) {
  const [favorite, setFavorite] = useState(false),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [localError, setLocalError] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void communityStore
        .read()
        .then((state) => {
          if (active) {
            setFavorite(state.favorites.includes(monument.id));
            setLocalError("");
          }
        })
        .catch(() => {
          if (active)
            setLocalError(
              "Les favoris ne peuvent pas être lus pour le moment.",
            );
        })
        .finally(() => {
          if (active) setReady(true);
        });
      return () => {
        active = false;
      };
    }, [monument.id]),
  );
  async function share() {
    try {
      const content = publicShare(monument);
      await Share.share(
        Platform.OS === "ios"
          ? {
              title: content.title,
              message: `${content.title}\nDécouvert avec Vestige · fiche source publique`,
              url: content.url,
            }
          : { title: content.title, message: content.message },
      );
    } catch {
      Alert.alert(
        "Partage indisponible",
        "Aucun lien public utilisable ou partage interrompu. Réessayez depuis les sources.",
      );
    }
  }
  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const state = await communityStore.toggleFavorite(monument.id);
      setFavorite(state.favorites.includes(monument.id));
    } catch {
      Alert.alert(
        "Favori non enregistré",
        "Vérifiez le stockage local et réessayez.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button title="+ Contribuer" onPress={contribute} />
        </View>
        <View style={{ flex: 1 }}>
          <Button secondary title="Partager" onPress={() => void share()} />
        </View>
      </View>
      <Button
        secondary
        title={
          favorite
            ? "Retirer de mes favoris privés"
            : "Garder dans mes favoris privés"
        }
        disabled={busy || !ready}
        onPress={() => void toggle()}
      />
      <Button
        secondary
        title="Raconter ma découverte · communauté locale"
        onPress={() =>
          router.push({
            pathname: "/communaute/creer",
            params: { kind: "discovery", poi: monument.id },
          })
        }
      />
      <Button secondary title="Préparer un signalement" onPress={report} />
      {!!localError && (
        <Text accessibilityRole="alert" style={s.caption}>
          {localError}
        </Text>
      )}
      <Text style={s.caption}>
        Le partage ouvre une référence publique lisible sans compte. Les pages
        web Vestige ne sont pas encore disponibles. Aucune position personnelle
        ni progression n’est partagée.
      </Text>
    </View>
  );
}
