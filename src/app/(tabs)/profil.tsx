import { router } from "expo-router";
import { useAvatarPreferences } from "../../lib/avatars/preferences";
import { avatarCharacters } from "../../lib/avatars/catalogue";
import React from "react";
import { Text, View, Linking, Alert } from "react-native";
import { useGame } from "../../lib/store";
import { levelFor } from "../../lib/game";
import { achievements } from "../../lib/achievements";
import { monuments } from "../../data/monuments";
import { ExplorerAvatar } from "../../components/exploration/ExplorerAvatar";
import {
  Page,
  Card,
  Button,
  Badge,
  XPBar,
  StatTile,
  Icon,
  s,
} from "../../components/ui";
import { colors, theme } from "../../theme";
export default function Profil() {
  const { xp, journal, gps, fix, requestGPS, storageError } = useGame();
  const avatar = useAvatarPreferences();
  const chosen = avatarCharacters.find((item) => item.id === avatar.choice);
  const badges = achievements(journal, monuments);
  const visited = monuments.filter((m) => journal[m.id]);
  const cities = new Set(visited.map((m) => m.city)).size;
  return (
    <Page eyebrow="Votre aventure VESTIGE" title="L’exploration vous ressemble">
      <Card style={{ alignItems: "center" }}>
        <View
          style={{
            width: 94,
            height: 94,
            borderRadius: theme.radius.xl,
            backgroundColor: colors.raised,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ExplorerAvatar size={82} />
        </View>
        <Badge>Niveau {levelFor(xp)} · Explorateur</Badge>
        <Text style={s.heading}>Passeur de mémoire</Text>
        <Text style={s.caption}>
          {avatar.pending
            ? `${chosen?.name} · préférence en attente du modèle`
            : avatar.activeChoice === "legacy"
              ? "Avatar actuel"
              : chosen?.name}
        </Text>
        <Button
          title="Choisir mon explorateur"
          secondary
          onPress={() => router.push("/avatars")}
        />
        <XPBar xp={xp} />
        <View
          style={{
            flexDirection: "row",
            alignSelf: "stretch",
            paddingTop: theme.space.xs,
            gap: theme.space.md,
          }}
        >
          <StatTile value={xp} label="XP gagnés" />
          <StatTile value={visited.length} label="Monuments" tone="turquoise" />
          <StatTile value={cities} label="Villes" tone="blue" />
        </View>
      </Card>
      <Text style={s.heading}>Vos badges historiques</Text>
      {badges.map((b) => (
        <Card key={b.id}>
          <View
            style={{
              flexDirection: "row",
              gap: theme.space.sm,
              alignItems: "center",
            }}
          >
            <Icon
              name={b.value >= b.goal ? "ribbon" : "lock-closed-outline"}
              color={b.value >= b.goal ? colors.turquoise : colors.muted}
            />
            <View style={{ flex: 1, gap: theme.space.xxs }}>
              <Text style={s.rowTitle}>{b.title}</Text>
              <Text style={s.caption}>
                {b.value >= b.goal
                  ? "Débloqué par vos découvertes"
                  : `${b.value}/${b.goal} · ${b.description}`}
              </Text>
            </View>
          </View>
        </Card>
      ))}
      <Card>
        <Text style={s.heading}>Votre boussole</Text>
        <Text style={s.body}>
          {gps}
          {fix
            ? ` · précision ${fix.accuracy === null ? "indisponible" : `±${Math.round(fix.accuracy)} m`}`
            : ""}
        </Text>
        <Button
          title="Actualiser ma position"
          secondary
          onPress={() => void requestGPS()}
        />
        <Button
          title="Réglages de localisation ↗"
          secondary
          onPress={() => {
            void Linking.openSettings().catch(() =>
              Alert.alert(
                "Réglages indisponibles",
                "Ouvrez les réglages du téléphone.",
              ),
            );
          }}
        />
      </Card>
      <Card>
        <Badge tone="blue">Prochainement · non disponible</Badge>
        <Text style={s.heading}>Explorer ensemble</Text>
        <Text style={s.body}>
          Classements et communauté ne sont pas encore implémentés. Vos
          statistiques ci-dessus proviennent uniquement de votre carnet local.
        </Text>
      </Card>
      <Card>
        <Text style={s.heading}>Votre aventure reste locale</Text>
        <Text style={s.body}>
          Le carnet et les XP restent sur ce téléphone, sans compte ni
          synchronisation. VESTIGE n’enregistre pas vos positions GPS. Les fonds
          de carte dépendent d’Apple ou Google et nécessitent Internet.
        </Text>
        <Text style={s.caption}>
          Photos et fiches intégrées disponibles hors ligne. Localisation au
          premier plan uniquement. Désinstaller l’application efface la
          progression locale.
        </Text>
        {storageError && (
          <Text accessibilityRole="alert" style={s.body}>
            {storageError}
          </Text>
        )}
      </Card>
    </Page>
  );
}
