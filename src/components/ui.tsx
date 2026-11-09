import React from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Monument } from "../data/monuments";
export const colors = {
  bg: "#101e20",
  panel: "#192c2d",
  raised: "#243a3a",
  ink: "#f3efdf",
  muted: "#a5b9b4",
  gold: "#e3bd76",
  green: "#a5d8be",
  line: "#344a48",
};
export function Icon({
  name,
  color = colors.gold,
  size = 22,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color?: React.ComponentProps<typeof Ionicons>["color"];
  size?: number;
}) {
  return <Ionicons name={name} color={color} size={size} />;
}
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && { backgroundColor: colors.raised },
        (disabled || pressed) && { opacity: 0.5 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: colors.ink }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Page({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.page}>
      <ScrollView contentContainerStyle={s.pageContent}>
        <Text style={s.eyebrow}>{eyebrow}</Text>
        <Text accessibilityRole="header" style={s.title}>
          {title}
        </Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function MonumentRow({
  monument,
  discovered = false,
}: {
  monument: Monument;
  discovered?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir ${monument.name}`}
      onPress={() =>
        router.push({ pathname: "/monument/[id]", params: { id: monument.id } })
      }
      style={s.row}
    >
      <Image source={monument.image} style={s.thumb} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.eyebrow}>
          {monument.city} · {monument.era}
        </Text>
        <Text style={s.rowTitle}>{monument.name}</Text>
        <Text style={s.body}>
          {discovered
            ? "✦ Consigné dans le carnet"
            : `+ ${monument.xp} XP à découvrir`}
        </Text>
      </View>
      <Icon name={discovered ? "checkmark-circle" : "chevron-forward"} />
    </Pressable>
  );
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  pageContent: { padding: 24, paddingBottom: 40, gap: 16 },
  eyebrow: {
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Georgia",
    fontSize: 36,
    color: colors.ink,
    lineHeight: 42,
  },
  heading: { color: colors.ink, fontSize: 22, fontFamily: "Georgia" },
  body: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  button: {
    backgroundColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonText: { color: colors.bg, fontSize: 14, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  thumb: { width: 64, height: 82, borderRadius: 12 },
  rowTitle: { fontFamily: "Georgia", color: colors.ink, fontSize: 17 },
  track: {
    height: 5,
    backgroundColor: colors.line,
    borderRadius: 5,
    overflow: "hidden",
  },
});
