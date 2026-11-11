import React, { useState } from "react";
import { Alert, Share, Text, TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import { Badge, s } from "../ui";
import {
  shareCode,
  type CommunityItem,
  type SocialState,
} from "../../lib/community/model";
import { useCommunity } from "../../lib/community/CommunityProvider";
export function LocalNotice() {
  return (
    <View style={{ gap: 8 }}>
      <Badge tone="coral">Communauté · version locale</Badge>
      <Text style={s.caption}>
        Ce fil est conservé sur cet appareil. Aucun compte distant, aucune
        publication sur un réseau ni modération à distance. Partagez une copie
        par la feuille iOS ; le destinataire peut l’importer dans Vestige.
      </Text>
    </View>
  );
}
export function Field({
  label,
  value,
  change,
  max = 100,
  multiline = false,
  email = false,
  password = false,
}: {
  label: string;
  value: string;
  change: (s: string) => void;
  max?: number;
  multiline?: boolean;
  email?: boolean;
  password?: boolean;
}) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={s.caption}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={change}
        maxLength={max}
        multiline={multiline}
        autoCapitalize={email || password ? "none" : "sentences"}
        autoCorrect={!email && !password}
        keyboardType={email ? "email-address" : "default"}
        secureTextEntry={password}
        style={{
          color: "#F5F0E5",
          backgroundColor: "#0B2341",
          borderWidth: 1,
          borderColor: "#756443",
          borderRadius: 12,
          padding: 12,
          minHeight: multiline ? 96 : 48,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
export function useSocialAction() {
  const community = useCommunity(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function run(
    action: () => Promise<SocialState>,
    after?: () => void,
    recovery = false,
  ) {
    if (busy || !community.ready || (community.error && !recovery)) return;
    setBusy(true);
    setError("");
    try {
      community.update(await action());
      after?.();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Opération impossible. Réessayez.",
      );
    } finally {
      setBusy(false);
    }
  }
  return { ...community, busy, error: error || community.error, run, setError };
}
export function ErrorNotice({ message }: { message: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={[s.body, { color: "#FFB5A2" }]}>
      {message}
    </Text>
  ) : null;
}
export async function shareCreation(item: CommunityItem) {
  try {
    const code = shareCode(item);
    const url = Linking.createURL("/communaute/importer", {
      queryParams: { code },
    });
    await Share.share({
      title: item.title,
      message: `${item.title}\nPar ${item.author.alias} · communauté Vestige · non vérifié\nCopie de parcours ou découverte, sans photo privée ni position du joueur.\nLien de test (même serveur Expo Go) : ${url}\n\nCode à coller dans Communauté > Importer :\n${code}`,
    });
  } catch (e) {
    Alert.alert(
      "Partage indisponible",
      e instanceof Error ? e.message : "Réessayez.",
    );
  }
}
