import React from "react";
import {
  Image,
  View,
  Text,
  type ImageStyle,
  type StyleProp,
} from "react-native";
import type { Monument } from "../data/monuments";
export function MonumentPhoto({
  monument,
  style,
}: {
  monument: Monument;
  style?: StyleProp<ImageStyle>;
}) {
  if (monument.image)
    return (
      <Image
        source={monument.image}
        accessibilityLabel={`Photographie de ${monument.name}`}
        style={style}
      />
    );
  return (
    <View
      accessibilityLabel={`Photographie non disponible pour ${monument.name}`}
      style={[
        style,
        {
          backgroundColor: "#0B1B3D",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
      ]}
    >
      <Text style={{ fontSize: 28, color: "#32BCC0" }}>⌂</Text>
      <Text style={{ color: "#c7cede", fontSize: 9, textAlign: "center" }}>
        Photo à documenter
      </Text>
    </View>
  );
}
