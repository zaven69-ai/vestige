import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import { Icon, XPBar } from "../ui";
import { colors, theme } from "../../theme";
import { levelFor } from "../../lib/game";
import { ExplorerAvatar } from "./ExplorerAvatar";
import { officialLogo } from "../../theme/brandAssets";
export function MapButton({
  label,
  icon,
  onPress,
  active = false,
}: {
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        active && styles.active,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icon
        name={icon}
        color={active ? colors.turquoise : colors.ink}
        size={21}
      />
    </Pressable>
  );
}
export function ExplorerProfile({ xp, count }: { xp: number; count: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Profil, niveau ${levelFor(xp)}, ${xp} XP, ${count} monuments découverts`}
      onPress={() => router.push("/profil")}
      style={styles.profile}
    >
      <Image
        source={officialLogo}
        accessible={false}
        resizeMode="contain"
        style={{ width: 28, height: 28 }}
      />
      <View style={styles.portrait}>
        <ExplorerAvatar size={36} />
      </View>
      <View style={styles.stats}>
        <View style={styles.levelLine}>
          <Text style={styles.level}>NIV. {levelFor(xp)}</Text>
          <Text style={styles.count}>✦ {count}</Text>
        </View>
        <XPBar xp={xp} compact />
        <Text style={styles.xp}>{xp % 400} / 400 XP</Text>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  round: {
    width: 44,
    height: 44,
    backgroundColor: theme.surfaces.overlay,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow,
  },
  active: { borderColor: colors.turquoise },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.xs,
    padding: theme.space.xs,
    paddingRight: theme.space.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.surfaces.overlay,
    borderWidth: 1,
    borderColor: colors.line,
  },
  portrait: {
    width: 38,
    height: 42,
    backgroundColor: colors.raised,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  stats: { width: 76, gap: 5 },
  levelLine: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  level: {
    color: colors.violet,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1,
  },
  count: { color: colors.muted, fontSize: 10 },
  xp: { color: colors.muted, fontSize: 9 },
});
