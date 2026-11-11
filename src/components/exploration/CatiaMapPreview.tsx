import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CatiaSprite } from "./CatiaSprite";
import type { CatiaPhase } from "../../lib/avatars/catiaMap";
import type { AvatarFacing } from "../../lib/avatar";
const angles: AvatarFacing[] = ["s", "sw", "w", "nw", "n", "ne", "e", "se"];
export function CatiaMapPreview({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  const [phase, setPhase] = useState<CatiaPhase>("idle"),
    [angle, setAngle] = useState(0),
    [playing, setPlaying] = useState(true);
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: "32%",
        alignSelf: "center",
        alignItems: "center",
        zIndex: 4,
      }}
    >
      <CatiaSprite
        facing={angles[angle]}
        phase={phase}
        active={active && playing}
        reducedMotion={reducedMotion}
      />
      <View
        style={{
          backgroundColor: "#020D27F5",
          borderColor: "#32BCC0",
          borderWidth: 1,
          borderRadius: 16,
          padding: 10,
          maxWidth: 300,
          alignItems: "center",
          gap: 6,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
          Catia · aperçu sans position GPS
        </Text>
        <Text style={{ color: "#B9C5D8", fontSize: 11, textAlign: "center" }}>
          Aucune position réelle ni découverte simulée.
        </Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {(
            [
              ["idle", "Repos"],
              ["walk", "Marche"],
              ["run", "Course"],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityLabel={`Aperçu Catia : ${label}`}
              accessibilityState={{ checked: phase === id }}
              onPress={() => setPhase(id)}
              style={{
                padding: 10,
                borderRadius: 10,
                backgroundColor: phase === id ? "#22525C" : "#10233D",
              }}
            >
              <Text style={{ color: "#FFFFFF" }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tourner Catia de 45 degrés"
            onPress={() => setAngle((a) => (a + 1) % angles.length)}
            style={{ padding: 10 }}
          >
            <Text style={{ color: "#32BCC0" }}>Tourner ↻</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPlaying((p) => !p)}
            style={{ padding: 10 }}
          >
            <Text style={{ color: "#32BCC0" }}>
              {playing ? "Pause" : "Animer"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
