import React, { useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { monuments } from "../../data/monuments";
import { useGame } from "../../lib/store";
import {
  Page,
  MonumentRow,
  Card,
  Button,
  Badge,
  ProgressBar,
  Icon,
  s,
} from "../../components/ui";
import { colors, theme } from "../../theme";
export default function Carnet() {
  const { journal, ready, storageError } = useGame();
  const [city, setCity] = useState("Tous");
  const found = monuments
    .filter((m) => journal[m.id])
    .sort((a, b) => journal[b.id] - journal[a.id]);
  const shown = city === "Tous" ? found : found.filter((m) => m.city === city);
  return (
    <Page eyebrow="Votre collection" title="Le carnet des découvertes">
      <Card>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Icon name="book-outline" color={colors.turquoise} size={26} />
          <Badge tone="turquoise">
            {found.length} / {monuments.length} monuments
          </Badge>
        </View>
        <ProgressBar
          value={found.length}
          max={monuments.length}
          label="Collection de monuments"
          tone="turquoise"
        />
        <Text style={s.caption}>
          Des lieux visités, des histoires qui restent. Votre collection est
          conservée sur ce téléphone.
        </Text>
      </Card>
      {storageError && (
        <Text accessibilityRole="alert" style={s.body}>
          {storageError}
        </Text>
      )}
      {!ready && !storageError && (
        <Text style={s.body}>Ouverture du carnet…</Text>
      )}
      {ready && !found.length && (
        <Card>
          <Text style={s.heading}>Votre première découverte vous attend.</Text>
          <Text style={s.body}>
            Approchez-vous d’un monument et validez sa découverte depuis sa
            fiche. Il apparaîtra ici avec sa photographie et son histoire.
          </Text>
          <Button title="Explorer la carte" onPress={() => router.push("/")} />
        </Card>
      )}
      {found.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.space.xs,
          }}
        >
          {["Tous", ...new Set(found.map((m) => m.city))].map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: city === item }}
              onPress={() => setCity(item)}
              style={{
                padding: theme.space.sm,
                borderRadius: theme.radius.pill,
                borderWidth: 1,
                borderColor: city === item ? colors.turquoise : colors.line,
                backgroundColor: colors.panel,
              }}
            >
              <Text
                style={{
                  color: city === item ? colors.turquoise : colors.muted,
                  fontWeight: "600",
                }}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {shown.map((m) => (
        <MonumentRow key={m.id} monument={m} discovered />
      ))}
      {found.length > 0 && !shown.length && (
        <Text style={s.body}>
          Aucune découverte dans cette ville pour le moment.
        </Text>
      )}
    </Page>
  );
}
