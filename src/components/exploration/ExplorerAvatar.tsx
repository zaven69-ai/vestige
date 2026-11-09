import React from "react";
import { StyleSheet, View } from "react-native";
export type AvatarAppearance = {
  coat: string;
  hat: string;
  skin: string;
  pack: string;
};
export const defaultAppearance: AvatarAppearance = {
  coat: "#426c61",
  hat: "#d6b783",
  skin: "#c98d69",
  pack: "#ad7046",
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
    borderBottomColor: "#e3bd76",
  },
  shadow: {
    position: "absolute",
    width: 39,
    height: 12,
    bottom: 0,
    left: 13,
    borderRadius: 20,
    backgroundColor: "#122b2c44",
  },
  pack: {
    position: "absolute",
    width: 34,
    height: 28,
    borderRadius: 9,
    left: 15,
    top: 27,
    borderWidth: 2,
    borderColor: "#553d30",
  },
  coat: {
    position: "absolute",
    width: 28,
    height: 26,
    top: 29,
    left: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#213c35",
  },
  arm: {
    position: "absolute",
    width: 11,
    height: 21,
    top: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#213c35",
  },
  shirt: {
    position: "absolute",
    width: 7,
    height: 17,
    top: 33,
    left: 29,
    backgroundColor: "#eee3c6",
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  strap: {
    position: "absolute",
    width: 4,
    height: 28,
    top: 28,
    left: 31,
    backgroundColor: "#8a5b3d",
    transform: [{ rotate: "31deg" }],
  },
  bootLeft: {
    position: "absolute",
    bottom: 2,
    left: 21,
    width: 10,
    height: 12,
    backgroundColor: "#37332c",
    borderRadius: 4,
  },
  bootRight: {
    position: "absolute",
    bottom: 2,
    right: 21,
    width: 10,
    height: 12,
    backgroundColor: "#37332c",
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
    borderColor: "#9a6249",
  },
  eyeLeft: {
    position: "absolute",
    top: 25,
    left: 26,
    width: 2.5,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#352c27",
  },
  eyeRight: {
    position: "absolute",
    top: 25,
    right: 26,
    width: 2.5,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#352c27",
  },
  scarf: {
    position: "absolute",
    top: 32,
    left: 22,
    width: 20,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#bd773f",
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
    borderColor: "#876845",
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
    borderColor: "#876845",
  },
  hatBand: {
    position: "absolute",
    left: 21,
    top: 16,
    width: 23,
    height: 4,
    backgroundColor: "#5c4a36",
  },
  compass: {
    position: "absolute",
    left: 37,
    top: 42,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e7c883",
    borderWidth: 1,
    borderColor: "#755b31",
    alignItems: "center",
    justifyContent: "center",
  },
  needle: {
    width: 2,
    height: 5,
    backgroundColor: "#40695c",
    transform: [{ rotate: "30deg" }],
  },
});
