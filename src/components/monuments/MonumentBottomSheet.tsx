import React, { useMemo } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Monument } from "../../data/monuments";
import { theme, colors } from "../../theme";
import { Icon } from "../ui";
import { MonumentDetails } from "./MonumentDetails";
import { useReducedMotion } from "../../hooks/useExplorerSensors";
export function MonumentBottomSheet({
  monument,
  close,
}: {
  monument: Monument | null;
  close: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const gesture = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, movement) =>
          Math.abs(movement.dy) > 10,
        onPanResponderRelease: (_event, movement) => {
          if (movement.dy > 45) close();
        },
      }),
    [close],
  );
  return (
    <Modal
      visible={!!monument}
      transparent
      animationType={reduced ? "none" : "slide"}
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Réduire la fiche historique"
          style={StyleSheet.absoluteFill}
          onPress={close}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { marginTop: insets.top + 32, paddingBottom: insets.bottom },
          ]}
        >
          <View {...gesture.panHandlers} style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.titleLine}>
              <Text style={styles.label}>ARCHIVES VESTIGE</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Réduire la fiche et retrouver la carte"
                onPress={close}
                style={styles.close}
              >
                <Icon name="chevron-down" />
              </Pressable>
            </View>
          </View>
          {monument && (
            <MonumentDetails
              key={monument.id}
              monument={monument}
              onNavigate={close}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  header: {
    paddingTop: theme.space.xs,
    paddingHorizontal: theme.space.lg,
    backgroundColor: colors.panel,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.muted,
    borderRadius: theme.radius.pill,
    alignSelf: "center",
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { ...theme.type.label, color: colors.blue },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
