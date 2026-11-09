import React, { useEffect, useState } from "react";
import { ScrollView, Image, View, Text, Linking, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { monuments } from "../../data/monuments";
import { useGame } from "../../lib/store";
import { canDiscover, distance, formatDistance } from "../../lib/game";
import { Button, colors, s } from "../../components/ui";
export default function MonumentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const monument = monuments.find((m) => m.id === id);
  const { fix, journal, discover, requestGPS, ready, storageError } = useGame();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!monument)
    return (
      <View style={s.page}>
        <Text style={s.body}>Ce lieu est introuvable.</Text>
      </View>
    );
  const found = !!journal[monument.id],
    eligible = canDiscover(fix, monument, now);
  const open = (url: string) => {
    void Linking.openURL(url).catch(() =>
      Alert.alert("Lien indisponible", "Vérifiez votre connexion Internet."),
    );
  };
  async function claim() {
    const result = await discover(monument!.id);
    if (result === "ok")
      Alert.alert(
        "Une trace retrouvée ✦",
        `${monument!.name}\n+${monument!.xp} XP · ajouté à votre carnet.`,
      );
    else
      Alert.alert(
        "Découverte non validée",
        result === "gps"
          ? "Approchez-vous à moins de 100 m avec une position récente et une précision de 50 m ou mieux."
          : result === "already"
            ? "Ce monument figure déjà dans votre carnet."
            : "Le carnet ne peut pas être sauvegardé pour le moment.",
      );
  }
  return (
    <ScrollView style={s.page} contentContainerStyle={{ paddingBottom: 36 }}>
      <Image
        source={monument.image}
        accessibilityLabel={`Photographie de ${monument.name}`}
        style={{ height: 280, width: "100%" }}
      />
      <View style={{ padding: 24, gap: 18 }}>
        <Text style={s.eyebrow}>
          {monument.city} · {monument.era} · +{monument.xp} XP
        </Text>
        <Text style={s.title}>{monument.name}</Text>
        <View style={s.card}>
          <Text style={s.heading}>
            {found ? "Une page de votre histoire" : "Retrouvez ce vestige"}
          </Text>
          <Text style={s.body}>
            {found
              ? `Découvert le ${new Date(journal[monument.id]).toLocaleDateString("fr-FR")}`
              : fix
                ? `${formatDistance(distance(fix, monument))} de votre position · précision ±${Math.round(fix.accuracy ?? 0)} m. Validation dans un rayon de 100 m, GPS récent et précis à 50 m ou mieux.`
                : "Activez votre localisation pour découvrir ce lieu. La lecture de sa fiche reste accessible partout."}
          </Text>
          {storageError && <Text style={s.body}>{storageError}</Text>}
          {!fix && !found && (
            <Button
              title="Activer ma position"
              onPress={() => void requestGPS()}
              secondary
            />
          )}
          <Button
            title={
              found
                ? "Consigné dans le carnet ✓"
                : eligible
                  ? "Découvrir ce monument"
                  : "Rapprochez-vous pour découvrir"
            }
            disabled={found || !eligible || !ready || !!storageError}
            onPress={() => void claim()}
          />
        </View>
        <Text style={s.heading}>Les pierres se souviennent.</Text>
        <Text
          style={[s.body, { fontSize: 16, lineHeight: 27, color: colors.ink }]}
        >
          {monument.description}
        </Text>
        <Text style={s.body}>
          La proximité GPS ne garantit pas l’accès au site. Respectez les
          horaires, les voies publiques et les zones fermées.
        </Text>
        <Text style={s.eyebrow}>Sources & photographie</Text>
        <Button
          title="Lire la source historique · Wikipédia ↗"
          secondary
          onPress={() => open(monument.source)}
        />
        <Text style={s.body}>{monument.attribution}</Text>
        <Button
          title="Auteur, licence et photographie originale ↗"
          secondary
          onPress={() => open(monument.photoPage)}
        />
        <Text style={s.body}>
          Textes issus des résumés Wikipédia, adaptés dans leur présentation ·
          CC BY-SA. Coordonnées et contenus consultés le 9 novembre 2026.
        </Text>
      </View>
    </ScrollView>
  );
}
