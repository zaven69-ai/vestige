import React from "react";
import { theme, colors } from "../../theme";
import { StyleSheet, View } from "react-native";
export type AvatarAppearance = {
  coat: string;
  hat: string;
  skin: string;
  pack: string;
};
export const defaultAppearance: AvatarAppearance = {
  coat: theme.avatar.coat,
  hat: theme.avatar.hat,
  skin: theme.avatar.skin,
  pack: theme.avatar.pack,
};
type Props = {
  size?: number;
  appearance?: AvatarAppearance;
  directional?: boolean;
};
/** Original 2D explorer. Presentation stays independent from GPS and the map renderer. */
export function ExplorerAvatar({
  size = 54,
  appearance = defaultAppearance,
  directional = false,
}: Props) {
  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={[styles.art, { transform: [{ scale: size / 64 }] }]}>
        {directional && <View style={styles.direction} />}
        <View style={styles.shadow} />
        <View style={[styles.pack, { backgroundColor: appearance.pack }]} />
        <View
          style={[
            styles.arm,
            {
              left: 10,
              transform: [{ rotate: "18deg" }],
              backgroundColor: appearance.coat,
            },
          ]}
        />
        <View
          style={[
            styles.arm,
            {
              right: 10,
              transform: [{ rotate: "-18deg" }],
              backgroundColor: appearance.coat,
            },
          ]}
        />
        <View style={styles.bootLeft} />
        <View style={styles.bootRight} />
        <View style={[styles.coat, { backgroundColor: appearance.coat }]} />
        <View style={styles.shirt} />
        <View style={styles.strap} />
        <View style={[styles.face, { backgroundColor: appearance.skin }]} />
        <View style={styles.scarf} />
        <View style={styles.eyeLeft} />
        <View style={styles.eyeRight} />
        <View style={[styles.brim, { backgroundColor: appearance.hat }]} />
        <View style={[styles.hat, { backgroundColor: appearance.hat }]} />
        <View style={styles.hatBand} />
        <View style={styles.compass}>
          <View style={styles.needle} />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  art: { width: 64, height: 64 },
  direction: {
    position: "absolute",
    top: 0,
    left: 28,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: colors.blue,
  },
  shadow: {
    position: "absolute",
    width: 39,
    height: 12,
    bottom: 0,
    left: 13,
    borderRadius: 20,
    backgroundColor: theme.avatar.shadow,
  },
  pack: {
    position: "absolute",
    width: 34,
    height: 28,
    borderRadius: 9,
    left: 15,
    top: 27,
    borderWidth: 2,
    borderColor: theme.avatar.outline,
  },
  coat: {
    position: "absolute",
    width: 28,
    height: 26,
    top: 29,
    left: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.avatar.outline,
  },
  arm: {
    position: "absolute",
    width: 11,
    height: 21,
    top: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.avatar.outline,
  },
  shirt: {
    position: "absolute",
    width: 7,
    height: 17,
    top: 33,
    left: 29,
    backgroundColor: theme.avatar.shirt,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  strap: {
    position: "absolute",
    width: 4,
    height: 28,
    top: 28,
    left: 31,
    backgroundColor: theme.avatar.pack,
    transform: [{ rotate: "31deg" }],
  },
  bootLeft: {
    position: "absolute",
    bottom: 2,
    left: 21,
    width: 10,
    height: 12,
    backgroundColor: theme.avatar.outline,
    borderRadius: 4,
  },
  bootRight: {
    position: "absolute",
    bottom: 2,
    right: 21,
    width: 10,
    height: 12,
    backgroundColor: theme.avatar.outline,
    borderRadius: 4,
  },
  face: {
    position: "absolute",
    left: 22,
    top: 15,
    width: 21,
    height: 22,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: theme.avatar.faceOutline,
  },
  eyeLeft: {
    position: "absolute",
    top: 25,
    left: 26,
    width: 2.5,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.avatar.eyes,
  },
  eyeRight: {
    position: "absolute",
    top: 25,
    right: 26,
    width: 2.5,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.avatar.eyes,
  },
  scarf: {
    position: "absolute",
    top: 32,
    left: 22,
    width: 20,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.avatar.scarf,
    transform: [{ rotate: "-8deg" }],
  },
  brim: {
    position: "absolute",
    left: 10,
    top: 16,
    width: 44,
    height: 11,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: theme.avatar.outline,
  },
  hat: {
    position: "absolute",
    left: 20,
    top: 6,
    width: 25,
    height: 16,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.avatar.outline,
  },
  hatBand: {
    position: "absolute",
    left: 21,
    top: 16,
    width: 23,
    height: 4,
    backgroundColor: theme.avatar.pack,
  },
  compass: {
    position: "absolute",
    left: 37,
    top: 42,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.avatar.compass,
    borderWidth: 1,
    borderColor: theme.avatar.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  needle: {
    width: 2,
    height: 5,
    backgroundColor: theme.avatar.coat,
    transform: [{ rotate: "30deg" }],
  },
});
