import { useIsFocused } from "expo-router";
import { useAvatarAssets } from "../exploration/avatar/useAvatarAssets";
import React, { useEffect, useState } from "react";
import { Image, View, Text, Pressable, AppState } from "react-native";
import {
  avatarSpec,
  type AvatarFacing,
  type AvatarPhase,
} from "../../lib/avatar";
import { useReducedMotion } from "../../hooks/useExplorerSensors";
import { avatarSprites } from "../exploration/avatar/sprites";
import { characterPacks } from "../../data/avatars/packs";
import type { AvatarChoice } from "../../lib/avatars/catalogue";
import { colors, s } from "../ui";
export function AvatarPreview({ choice }: { choice: AvatarChoice }) {
  const pack = choice === "legacy" ? undefined : characterPacks[choice];
  const sprites = pack?.sprites ?? avatarSprites;
  const [phase, setPhase] = useState<AvatarPhase>("idle");
  const [facing, setFacing] = useState<AvatarFacing>("s");
  const [frame, setFrame] = useState(0);
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );
    return () => sub.remove();
  }, []);
  const active = focused && foreground && !reduced;
  const ready = useAvatarAssets(
    facing,
    active,
    sprites,
    pack ? `${choice}:${pack.sourceSha256}` : "legacy:legacy-v1",
  );
  useEffect(() => {
    if (!active || !ready) return;
    const timer = setInterval(
      () =>
        setFrame(
          (value) =>
            (value + 1) %
            (phase === "idle" ? avatarSpec.idleFrames : avatarSpec.walkFrames),
        ),
      phase === "idle" ? avatarSpec.idleFrameMs : avatarSpec.walkFrameMs,
    );
    return () => clearInterval(timer);
  }, [phase, active, ready, choice]);
  const pose = !active || !ready ? "idle" : phase;
  const image = sprites[facing][pose][frame % sprites[facing][pose].length];
  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          alignItems: "center",
          paddingVertical: 12,
          borderRadius: 24,
          backgroundColor: colors.raised,
        }}
      >
        <Image
          source={image}
          resizeMode="contain"
          fadeDuration={0}
          accessibilityLabel={
            pack
              ? "Rendu 2D issu du modèle 3D validé"
              : "Avatar actuel conservé, distinct des futurs Alex et Léa"
          }
          style={{ width: 160, height: 208 }}
        />
        <Text style={[s.caption, { textAlign: "center", padding: 12 }]}>
          {pack
            ? "Sprites 2D calculés depuis le GLB riggé validé"
            : "Avatar actuel · aucun modèle Alex/Léa intégré"}
        </Text>
      </View>
      <Text style={s.caption}>
        Démonstration en atelier uniquement : ces commandes ne déplacent pas le
        joueur et ne valident aucune découverte. Sur la carte, la marche dépend
        du GPS réel.
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["idle", "walk"] as const).map((value) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              selected: phase === value,
              disabled: reduced,
            }}
            disabled={reduced}
            key={value}
            onPress={() => {
              setFrame(0);
              setPhase(value);
            }}
            style={{
              flex: 1,
              minHeight: 44,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: phase === value ? colors.turquoise : colors.line,
            }}
          >
            <Text style={{ color: colors.ink, textAlign: "center" }}>
              {value === "idle" ? "Attente" : "Marche · démo"}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {(
          [
            ["n", "Dos"],
            ["e", "Profil droit"],
            ["s", "Face"],
            ["w", "Profil gauche"],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: facing === value }}
            onPress={() => setFacing(value)}
            style={{
              flex: 1,
              paddingVertical: 12,
              minHeight: 44,
              borderBottomWidth: 2,
              borderBottomColor: facing === value ? colors.violet : colors.line,
            }}
          >
            <Text
              style={{ color: colors.ink, textAlign: "center", fontSize: 11 }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {reduced && (
        <Text style={s.caption}>
          Réduire les animations est activé : pose statique.
        </Text>
      )}
    </View>
  );
}
