import React from "react";
import { Image, Text, View, StyleSheet } from "react-native";
import { officialLogo } from "../../theme/brandAssets";
import { colors, theme } from "../../theme";
export function BrandSignature({
  size = "small",
}: {
  size?: "small" | "launch";
}) {
  const launch = size === "launch";
  return (
    <View
      style={[
        styles.brand,
        launch && { flexDirection: "column", gap: theme.space.lg },
      ]}
      accessibilityLabel="VESTIGE, exploration historique"
    >
      {officialLogo && (
        <Image
          source={officialLogo}
          resizeMode="contain"
          style={{ width: launch ? 180 : 40, height: launch ? 158 : 36 }}
        />
      )}
      <Text
        style={[styles.wordmark, launch && { fontSize: 27, letterSpacing: 5 }]}
      >
        VESTIGE
      </Text>
    </View>
  );
}
export function BrandLaunch() {
  return (
    <View style={styles.launch}>
      <BrandSignature size="launch" />
      <Text style={styles.tagline}>L’histoire commence sous vos pas.</Text>
      <Text style={styles.loading}>Ouverture de votre carnet…</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  brand: { flexDirection: "row", gap: theme.space.xs, alignItems: "center" },
  wordmark: {
    color: colors.ink,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: "800",
  },
  launch: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.lg,
  },
  tagline: { ...theme.type.body, color: colors.muted },
  loading: {
    ...theme.type.caption,
    color: colors.turquoise,
    marginTop: theme.space.lg,
  },
});
