import React, { useEffect, useState } from "react";
import { Alert, Image, Linking, ScrollView, Text, View } from "react-native";
import type { Monument } from "../../data/monuments";
import { useGame } from "../../lib/store";
import {
  canDiscover,
  distance,
  formatDistance,
  levelFor,
} from "../../lib/game";
import { Badge, Button, Card, colors, s } from "../ui";
import { theme } from "../../theme";
import { DiscoveryNotice, type DiscoveryReceipt } from "./DiscoveryNotice";
export function MonumentDetails({ monument }: { monument: Monument }) {
  const { fix, journal, discover, requestGPS, ready, storageError, xp } =
    useGame();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<DiscoveryReceipt | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const found = !!journal[monument.id],
    eligible = canDiscover(fix, monument, now);
  const open = (url: string) => {
    void Linking.openURL(url).catch(() =>
      Alert.alert("Lien indisponible", "Vérifiez votre connexion Internet."),
    );
  };
  async function claim() {
    if (busy) return;
    setBusy(true);
    const previousLevel = levelFor(xp);
    const result = await discover(monument.id);
    setBusy(false);
    if (result === "ok")
      setReceipt({
        title: monument.name,
        xp: monument.xp,
        previousLevel,
        nextLevel: levelFor(xp + monument.xp),
      });
    else
      Alert.alert(
        "Découverte non validée",
        result === "gps"
          ? "Approchez-vous à moins de 100 m avec un relevé de moins de 30 secondes et une précision de 50 m ou mieux."
          : result === "already"
            ? "Ce monument figure déjà dans votre carnet."
            : "Le carnet ne peut pas être sauvegardé pour le moment.",
      );
  }
  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.space.xxl }}>
        <Image
          source={monument.image}
          accessibilityLabel={`Photographie de ${monument.name}`}
          style={{ height: 220, width: "100%" }}
        />
        <View style={{ padding: theme.space.lg, gap: theme.space.lg }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: theme.space.xs,
            }}
          >
            <Badge tone="blue">{monument.city}</Badge>
            <Badge>{monument.era}</Badge>
            <Badge tone={found ? "turquoise" : "coral"}>
              {found ? "Découvert ✓" : `+${monument.xp} XP`}
            </Badge>
          </View>
          <Text accessibilityRole="header" style={s.title}>
            {monument.name}
          </Text>
          <Card>
            <Text style={s.heading}>
              {found
                ? "Une page de votre histoire"
                : "À vous de découvrir ce lieu"}
            </Text>
            <Text style={s.body}>
              {found
                ? `Découvert le ${new Date(journal[monument.id]).toLocaleDateString("fr-FR")}`
                : fix
                  ? `${formatDistance(distance(fix, monument))} depuis le dernier relevé · précision ${fix.accuracy === null ? "indisponible" : `±${Math.round(fix.accuracy)} m`}. Validation dans un rayon de 100 m avec un GPS récent et précis.`
                  : "Activez votre position. L’histoire du lieu reste accessible partout."}
            </Text>
            {storageError && (
              <Text accessibilityRole="alert" style={s.body}>
                {storageError}
              </Text>
            )}
            {(!fix || now - fix.timestamp >= 30000) && !found && (
              <Button
                title={fix ? "Actualiser ma position" : "Activer ma position"}
                onPress={() => void requestGPS()}
                secondary
              />
            )}
            <Button
              title={
                busy
                  ? "Enregistrement…"
                  : found
                    ? "Consigné dans le carnet ✓"
                    : eligible
                      ? "Découvrir ce monument"
                      : "Rapprochez-vous pour découvrir"
              }
              disabled={busy || found || !eligible || !ready || !!storageError}
              onPress={() => void claim()}
            />
          </Card>
          <Text style={s.heading}>L’histoire du lieu</Text>
          <Text style={[s.body, { color: colors.ink, lineHeight: 25 }]}>
            {monument.description}
          </Text>
          <Text style={s.caption}>
            La proximité GPS ne garantit pas l’accès au site. Respectez les
            horaires, les voies publiques et les zones fermées.
          </Text>
          <Text style={s.eyebrow}>Sources & photographie</Text>
          <Button
            title="Source historique · Wikipédia ↗"
            secondary
            onPress={() => open(monument.source)}
          />
          <Text style={s.caption}>{monument.attribution}</Text>
          <Button
            title="Auteur, licence et photographie originale ↗"
            secondary
            onPress={() => open(monument.photoPage)}
          />
          <Text style={s.caption}>
            Textes issus des résumés Wikipédia · CC BY-SA. Sources et
            coordonnées consultées le 9 novembre 2026.
          </Text>
        </View>
      </ScrollView>
      <DiscoveryNotice receipt={receipt} close={() => setReceipt(null)} />
    </View>
  );
}
