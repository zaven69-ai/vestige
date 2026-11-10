import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View, AppState } from "react-native";
import { Stack, useIsFocused } from "expo-router";
import { Page, Card, Badge, s, colors } from "../components/ui";
import status from "../data/avatars/catia.json";
import { catiaBlockers } from "../lib/avatars/catia";

// These frames are rendered from the corrected GLB, not from a new character.
// Preview only: the actual GLB is NOT rendered in real time by this screen.
const sequences = {
  idle: {
    front: [
      require("../../docs/avatars/catia/revision-2/after/idle-front-12.png"),
      require("../../docs/avatars/catia/revision-2/after/idle-front-37.png"),
      require("../../docs/avatars/catia/revision-2/after/idle-front-62.png"),
      require("../../docs/avatars/catia/revision-2/after/idle-front-87.png"),
    ],
    side: [
      require("../../docs/avatars/catia/revision-2/after/idle-side-12.png"),
      require("../../docs/avatars/catia/revision-2/after/idle-side-37.png"),
      require("../../docs/avatars/catia/revision-2/after/idle-side-62.png"),
      require("../../docs/avatars/catia/revision-2/after/idle-side-87.png"),
    ],
  },
  walk: {
    front: [
      require("../../docs/avatars/catia/revision-2/after/walk-front-12.png"),
      require("../../docs/avatars/catia/revision-2/after/walk-front-37.png"),
      require("../../docs/avatars/catia/revision-2/after/walk-front-62.png"),
      require("../../docs/avatars/catia/revision-2/after/walk-front-87.png"),
    ],
    side: [
      require("../../docs/avatars/catia/revision-2/after/walk-side-12.png"),
      require("../../docs/avatars/catia/revision-2/after/walk-side-37.png"),
      require("../../docs/avatars/catia/revision-2/after/walk-side-62.png"),
      require("../../docs/avatars/catia/revision-2/after/walk-side-87.png"),
    ],
  },
  run: {
    front: [
      require("../../docs/avatars/catia/revision-2/after/run-front-12.png"),
      require("../../docs/avatars/catia/revision-2/after/run-front-37.png"),
      require("../../docs/avatars/catia/revision-2/after/run-front-62.png"),
      require("../../docs/avatars/catia/revision-2/after/run-front-87.png"),
    ],
    side: [
      require("../../docs/avatars/catia/revision-2/after/run-side-12.png"),
      require("../../docs/avatars/catia/revision-2/after/run-side-37.png"),
      require("../../docs/avatars/catia/revision-2/after/run-side-62.png"),
      require("../../docs/avatars/catia/revision-2/after/run-side-87.png"),
    ],
  },
} as const;

type Motion = keyof typeof sequences;
type Angle = "front" | "side";
const motions: { id: Motion; label: string }[] = [
  { id: "idle", label: "Attente" },
  { id: "walk", label: "Marche" },
  { id: "run", label: "Course" },
];

export default function CatiaPreview() {
  const [motion, setMotion] = useState<Motion>("idle");
  const [angle, setAngle] = useState<Angle>("front");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const focused = useIsFocused();
  const active = focused && foreground && playing;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) =>
      setForeground(next === "active"),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setFrame((current) => (current + 1) % 4);
    }, motion === "idle" ? 400 : motion === "walk" ? 180 : 130);
    return () => clearInterval(interval);
  }, [active, motion]);

  const chooseMotion = (value: Motion) => {
    setMotion(value);
    setFrame(0);
    setPlaying(true);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Atelier Catia · test" }} />
      <Page eyebrow="Atelier Vestige" title="Catia en mouvement">
        <Card>
          <Badge tone="coral">Aperçu privé · non activée sur la carte</Badge>
          <Text style={s.body}>
            Testez les poses de Catia issues du modèle corrigé. Le personnage
            actuel, votre GPS, votre carnet et vos XP restent inchangés.
          </Text>
        </Card>
        <Card>
          <Image
            source={sequences[motion][angle][frame]}
            resizeMode="contain"
            accessibilityLabel={`Catia : ${motion}, vue ${angle}, image ${frame + 1} sur 4`}
            style={{
              width: "100%",
              height: 370,
              borderRadius: 18,
              backgroundColor: colors.raised,
            }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {motions.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: motion === item.id }}
                onPress={() => chooseMotion(item.id)}
                style={{
                  flex: 1,
                  minHeight: 48,
                  justifyContent: "center",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: motion === item.id ? colors.turquoise : colors.line,
                }}
              >
                <Text style={{ color: colors.ink, textAlign: "center" }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["front", "side"] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: angle === value }}
                onPress={() => { setAngle(value); setFrame(0); }}
                style={{
                  flex: 1,
                  minHeight: 44,
                  justifyContent: "center",
                  borderBottomWidth: 2,
                  borderBottomColor: angle === value ? colors.violet : colors.line,
                }}
              >
                <Text style={{ color: colors.ink, textAlign: "center" }}>
                  {value === "front" ? "Face" : "Profil"}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playing ? "Mettre en pause" : "Reprendre"}
              onPress={() => setPlaying((value) => !value)}
              style={{ minWidth: 80, minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ color: colors.ink, textAlign: "center" }}>
                {playing ? "Pause" : "Lecture"}
              </Text>
            </Pressable>
          </View>
          <Text style={s.caption}>
            Prévisualisation animée à partir de 4 poses rendues par mouvement
            et par angle. Ce n’est pas encore un lecteur GLB 3D temps réel :
            fluidité et GPS devront être testés séparément sur iPhone.
          </Text>
        </Card>
        <Card>
          <Text style={s.heading}>Validation avant activation</Text>
          <Text style={s.body}>
            Modèle corrigé : 24 996 triangles, 17 os, Idle / Walk / Run.
          </Text>
          {catiaBlockers(status).map((reason) => (
            <Text key={reason} style={s.caption}>• {reason}</Text>
          ))}
          <Text style={s.caption}>
            Aucun déplacement virtuel, gain d’XP ou déblocage de lieu dans cet atelier.
          </Text>
        </Card>
      </Page>
    </>
  );
}
