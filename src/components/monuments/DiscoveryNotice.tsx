import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme, colors } from "../../theme";
import { Button, Icon } from "../ui";
import { useReducedMotion } from "../../hooks/useExplorerSensors";
export type DiscoveryReceipt = {
  title: string;
  xp: number;
  previousLevel: number;
  nextLevel: number;
};
export function DiscoveryNotice({
  receipt,
  close,
}: {
  receipt: DiscoveryReceipt | null;
  close: () => void;
}) {
  const [entrance] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!receipt) return;
    entrance.setValue(reduced ? 1 : 0);
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: reduced ? 0 : theme.motion.reward,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [receipt, entrance, reduced]);
  if (!receipt) return null;
  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Animated.View
        style={[
          styles.card,
          {
            opacity: entrance,
            transform: [
              {
                scale: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["-12deg", "0deg"],
                }),
              },
              {
                scale: entrance.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [0.7, 1.08, 1],
                }),
              },
            ],
          }}
        >
          <LinearGradient
            colors={theme.gradients.primary}
            style={styles.emblem}
          >
            <Icon name="sparkles" color={colors.bg} size={30} />
          </LinearGradient>
        </Animated.View>
        <Text accessibilityRole="header" style={styles.label}>
          VESTIGE DÉCOUVERT !
        </Text>
        <Text style={styles.title}>{receipt.title}</Text>
        <Text style={styles.xp}>+{receipt.xp} XP</Text>
        {receipt.nextLevel > receipt.previousLevel && (
          <Text style={styles.level}>Niveau {receipt.nextLevel} atteint !</Text>
        )}
        <Text style={styles.caption}>
          Découverte enregistrée dans votre carnet.
        </Text>
        <Button title="Continuer l’exploration" onPress={close} />
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    backgroundColor: theme.colors.scrim,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.space.xl,
  },
  card: {
    alignSelf: "stretch",
    padding: theme.space.xl,
    gap: theme.space.md,
    borderRadius: theme.radius.xl,
    borderColor: `${colors.violet}80`,
    borderWidth: 1,
    backgroundColor: colors.panel,
    ...theme.shadow,
  },
  emblem: {
    width: 64,
    height: 64,
    alignSelf: "center",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { ...theme.type.label, color: colors.turquoise, textAlign: "center" },
  title: { ...theme.type.section, color: colors.ink, textAlign: "center" },
  xp: { ...theme.type.statistic, color: colors.violet, textAlign: "center" },
  level: { ...theme.type.monument, color: colors.coral, textAlign: "center" },
  caption: { ...theme.type.caption, color: colors.muted, textAlign: "center" },
});
