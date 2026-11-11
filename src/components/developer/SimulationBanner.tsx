import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSimulationMode } from "../../lib/developer/DeveloperLocation";
export function SimulationNotice() {
  const { enabled } = useSimulationMode();
  return enabled ? (
    <Text accessibilityRole="alert" style={styles.text}>
      MODE TEST — GPS SIMULÉ · aucun XP
    </Text>
  ) : null;
}
export function SimulationBanner() {
  const { enabled } = useSimulationMode();
  const insets = useSafeAreaInsets();
  return enabled ? (
    <View pointerEvents="none" style={[styles.banner, { top: insets.top + 2 }]}>
      <SimulationNotice />
    </View>
  ) : null;
}
const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 1000,
    backgroundColor: "#492D09",
    borderWidth: 1,
    borderColor: "#F2C566",
    borderRadius: 10,
    padding: 8,
  },
  text: {
    color: "#FFE1A3",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
});
