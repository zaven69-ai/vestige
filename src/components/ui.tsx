import { MonumentPhoto } from "./MonumentPhoto";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import type { Monument } from "../data/monuments";
import { colors, theme } from "../theme";
import { BrandSignature } from "./brand/BrandSignature";
import { useReducedMotion } from "../hooks/useExplorerSensors";
export { colors } from "../theme";
export function Icon({
  name,
  color = colors.blue,
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
  const label = (
    <Text style={[s.buttonText, secondary && { color: colors.ink }]}>
      {title}
    </Text>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        (disabled || pressed) && { opacity: 0.5 },
        secondary && {
          backgroundColor: colors.raised,
          borderColor: colors.line,
          borderWidth: 1,
        },
      ]}
    >
      {secondary ? (
        label
      ) : (
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.buttonFill}
        >
          {label}
        </LinearGradient>
      )}
    </Pressable>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Badge({
  children,
  tone = "violet",
}: {
  children: React.ReactNode;
  tone?: "violet" | "turquoise" | "coral" | "blue";
}) {
  return (
    <View
      style={[
        s.badge,
        {
          backgroundColor: `${colors[tone]}18`,
          borderColor: `${colors[tone]}55`,
        },
      ]}
    >
      <Text
        style={[
          s.badgeText,
          { color: tone === "violet" ? colors.ink : colors[tone] },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}
export function ProgressBar({
  value,
  max,
  label,
  tone = "violet",
}: {
  value: number;
  max: number;
  label: string;
  tone?: "violet" | "turquoise" | "blue";
}) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const [progress] = useState(() => new Animated.Value(ratio));
  const reduced = useReducedMotion();
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: ratio,
      duration: reduced ? 0 : theme.motion.normal,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, ratio, reduced]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: value }}
      style={s.track}
    >
      <Animated.View
        style={{
          height: "100%",
          width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
          backgroundColor: colors[tone],
          borderRadius: theme.radius.pill,
        }}
      />
    </View>
  );
}
export function XPBar({
  xp,
  compact = false,
}: {
  xp: number;
  compact?: boolean;
}) {
  return (
    <View style={{ gap: theme.space.xxs, alignSelf: "stretch" }}>
      <ProgressBar
        value={xp % 400}
        max={400}
        label="Expérience avant le prochain niveau"
      />
      {!compact && (
        <Text style={s.caption}>
          {xp % 400} / 400 XP · {400 - (xp % 400)} XP avant le prochain niveau
        </Text>
      )}
    </View>
  );
}
export function StatTile({
  value,
  label,
  tone = "violet",
}: {
  value: string | number;
  label: string;
  tone?: "violet" | "turquoise" | "blue";
}) {
  return (
    <View style={{ flex: 1, gap: theme.space.xxs }}>
      <Text
        style={[
          s.statistic,
          { color: tone === "violet" ? colors.ink : colors[tone] },
        ]}
      >
        {value}
      </Text>
      <Text style={s.caption}>{label}</Text>
    </View>
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
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.page}>
      <ScrollView
        contentContainerStyle={[
          s.pageContent,
          { paddingBottom: insets.bottom + 108 },
        ]}
      >
        <BrandSignature />
        <View style={{ gap: theme.space.xs }}>
          <Text style={s.eyebrow}>{eyebrow}</Text>
          <Text accessibilityRole="header" style={s.title}>
            {title}
          </Text>
        </View>
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
      <MonumentPhoto monument={monument} style={s.thumb} />
      <View style={{ flex: 1, gap: theme.space.xxs }}>
        <Text style={s.eyebrow}>
          {monument.city} · {monument.era}
        </Text>
        <Text style={s.rowTitle}>{monument.name}</Text>
        <Text style={[s.caption, discovered && { color: colors.turquoise }]}>
          {discovered
            ? "Découvert · consigné dans le carnet"
            : `+${monument.xp} XP à découvrir`}
        </Text>
      </View>
      <Icon
        color={discovered ? colors.turquoise : colors.blue}
        name={discovered ? "checkmark-circle" : "chevron-forward"}
      />
    </Pressable>
  );
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  pageContent: { padding: theme.space.lg, gap: theme.space.lg },
  eyebrow: {
    ...theme.type.label,
    color: colors.blue,
    textTransform: "uppercase",
  },
  title: { ...theme.type.title, color: colors.ink },
  heading: { ...theme.type.section, color: colors.ink },
  body: { ...theme.type.body, color: colors.muted },
  caption: { ...theme.type.caption, color: colors.muted },
  statistic: { ...theme.type.statistic, color: colors.ink },
  card: {
    backgroundColor: colors.panel,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
  },
  badgeText: { fontSize: 11, lineHeight: 16, fontWeight: "700" },
  button: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFill: {
    width: "100%",
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: theme.space.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    padding: theme.space.sm,
    borderRadius: theme.radius.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  thumb: { width: 62, height: 78, borderRadius: theme.radius.sm },
  rowTitle: { ...theme.type.monument, color: colors.ink },
  track: {
    height: 6,
    backgroundColor: colors.line,
    borderRadius: theme.radius.pill,
    overflow: "hidden",
  },
});
