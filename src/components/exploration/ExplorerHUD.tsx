import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Icon, colors } from "../ui";
import { levelFor } from "../../lib/game";
import { ExplorerAvatar } from "./ExplorerAvatar";
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
      <Icon name={icon} color={active ? colors.gold : colors.ink} size={21} />
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
      <View style={styles.portrait}>
        <ExplorerAvatar size={36} />
      </View>
      <View style={styles.stats}>
        <View style={styles.levelLine}>
          <Text style={styles.level}>NIV. {levelFor(xp)}</Text>
          <Text style={styles.count}>✦ {count}</Text>
        </View>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 400,
            now: xp % 400,
            text: `${xp % 400} sur 400 XP avant le prochain niveau`,
          }}
        >
          <View style={[styles.fill, { width: `${(xp % 400) / 4}%` }]} />
        </View>
        <Text style={styles.xp}>{xp % 400} / 400 XP</Text>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  round: {
    width: 44,
    height: 44,
    backgroundColor: "#101e20f5",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#54706866",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#112626",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  active: { borderColor: colors.gold },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    paddingRight: 12,
    borderRadius: 19,
    backgroundColor: "#101e20f5",
    borderWidth: 1,
    borderColor: "#54706866",
  },
  portrait: {
    width: 38,
    height: 42,
    backgroundColor: "#345044",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stats: { width: 86, gap: 5 },
  levelLine: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  level: {
    color: colors.gold,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1,
  },
  count: { color: colors.muted, fontSize: 10 },
  track: {
    backgroundColor: colors.line,
    height: 4,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { backgroundColor: colors.gold, height: 4 },
  xp: { color: colors.muted, fontSize: 9 },
});
