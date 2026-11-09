import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Page, Card, Badge, Button, s, colors } from "../components/ui";
import { avatarCharacters, type AvatarChoice } from "../lib/avatars/catalogue";
import { useAvatarPreferences } from "../lib/avatars/preferences";
import { characterPacks } from "../data/avatars/packs";
import { AvatarPreview } from "../components/avatars/AvatarPreview";
export default function AvatarWorkshop() {
  const { choice, save, ready, error, pending, activeChoice } =
    useAvatarPreferences();
  const [draft, setDraft] = useState<AvatarChoice | null>(null);
  const selected = draft ?? choice;
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const character = avatarCharacters.find((item) => item.id === selected);
  const renderReady = selected !== "legacy" && !!characterPacks[selected];
  async function confirm() {
    setBusy(true);
    const ok = await save(selected);
    setBusy(false);
    setSaved(ok);
  }
  return (
    <>
      <Stack.Screen options={{ title: "Les explorateurs" }} />
      <Page
        eyebrow="Atelier des explorateurs"
        title="Une identité pour votre aventure"
      >
        <Card>
          <Badge tone="blue">Prototype Alex · Léa</Badge>
          <Text style={s.body}>
            Les six personnages suivent la référence officielle. Les modèles
            Alex et Léa sont à produire et à valider. Votre préférence peut être
            sauvegardée dès maintenant ; elle ne remplace l’avatar sur la carte
            que lorsqu’un pack validé est disponible.
          </Text>
        </Card>
        <Text style={s.heading}>Choisir une préférence</Text>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: selected === "legacy" }}
          onPress={() => {
            setDraft("legacy");
            setSaved(false);
          }}
          style={{
            ...s.card,
            borderColor: selected === "legacy" ? colors.turquoise : colors.line,
          }}
        >
          <Text style={s.rowTitle}>Conserver l’avatar actuel</Text>
          <Text style={s.caption}>Disponible · animations GPS existantes</Text>
        </Pressable>
        {avatarCharacters.map((item) => {
          const prototype = item.id === "alex" || item.id === "lea";
          const hasPack =
            prototype && !!characterPacks[item.id as "alex" | "lea"];
          return (
            <Pressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityLabel={`${item.name}, ${item.role}, ${hasPack ? "rendu validé disponible" : prototype ? "modèle non livré" : "phase suivante"}`}
              accessibilityState={{
                checked: selected === item.id,
                disabled: !prototype,
              }}
              disabled={!prototype}
              onPress={() => {
                setDraft(item.id as "alex" | "lea");
                setSaved(false);
              }}
              style={{
                ...s.card,
                borderColor: selected === item.id ? item.accent : colors.line,
                opacity: prototype ? 1 : 0.65,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "space-between",
                }}
              >
                <Text style={s.heading}>{item.name}</Text>
                <Badge tone={hasPack ? "turquoise" : "blue"}>
                  {hasPack
                    ? "Rendu validé"
                    : prototype
                      ? "Modèle à produire"
                      : "Phase suivante"}
                </Badge>
              </View>
              <Text style={s.rowTitle}>{item.role}</Text>
              <Text style={s.caption}>{item.personality}</Text>
              <View
                accessibilityLabel="Palette de la tenue"
                style={{ flexDirection: "row", gap: 6 }}
              >
                {item.palette.map((color) => (
                  <View
                    key={color}
                    style={{
                      width: 22,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: color,
                    }}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
        {character && (
          <Card>
            <Text style={s.heading}>Fiche de {character.name}</Text>
            <Text style={s.body}>{character.appearance}</Text>
            <Text style={s.body}>{character.outfit}</Text>
            <Text style={s.caption}>{character.accessories}</Text>
            <Text style={s.caption}>{character.silhouette}</Text>
          </Card>
        )}
        <Card>
          <Text style={s.heading}>
            {renderReady
              ? `Aperçu de ${character?.name}`
              : "Banc d’animation · avatar actuel"}
          </Text>
          <AvatarPreview choice={selected} />
        </Card>
        {error && (
          <Text accessibilityRole="alert" style={s.body}>
            {error}
          </Text>
        )}
        <Button
          disabled={!ready || busy}
          title={
            busy
              ? "Sauvegarde…"
              : renderReady
                ? "Utiliser ce personnage"
                : "Sauvegarder cette préférence"
          }
          onPress={() => void confirm()}
        />
        {(saved || pending) && (
          <Text accessibilityLiveRegion="polite" style={s.body}>
            {saved ? "Préférence sauvegardée. " : ""}
            {activeChoice === "legacy"
              ? "L’avatar actuel reste affiché sur la carte."
              : "Le personnage choisi est actif sur la carte."}
          </Text>
        )}
        <Text style={s.caption}>
          Choix cosmétique uniquement : aucun changement des XP, niveaux,
          découvertes ou capacités. Nova est prévue pour une phase ultérieure,
          sans bonus de jeu.
        </Text>
      </Page>
    </>
  );
}
