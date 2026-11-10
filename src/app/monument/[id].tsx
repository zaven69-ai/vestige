import { isPublicPoi } from "../../lib/poi";
import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { monuments } from "../../data/monuments";
import { MonumentDetails } from "../../components/monuments/MonumentDetails";
import { s } from "../../components/ui";
export default function MonumentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const monument = monuments.find((m) => m.id === id && isPublicPoi(m));
  return monument ? (
    <MonumentDetails monument={monument} />
  ) : (
    <View style={s.page}>
      <Text style={s.body}>Ce lieu est introuvable.</Text>
    </View>
  );
}
