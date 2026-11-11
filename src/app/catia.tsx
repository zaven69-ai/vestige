import { CatiaMotionFrames } from "../components/avatars/CatiaMotionFrames";
import React, { Suspense, lazy, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Page, Card, Badge, s, colors } from "../components/ui";
import status from "../data/avatars/catia.json";
import verification from "../../assets/avatars/catia/rig-lab/revision-2/verification.json";
import { CatiaViewerBoundary } from "../components/avatars/CatiaViewerBoundary";
import { catiaBlockers } from "../lib/avatars/catia";
const Catia3DPreview = lazy(
  () => import("../components/avatars/Catia3DPreview"),
);
const views = [
  {
    label: "Face",
    asset: require("../../assets/avatars/catia/previews/front.png"),
  },
  {
    label: "Profil",
    asset: require("../../assets/avatars/catia/previews/side.png"),
  },
  {
    label: "Dos",
    asset: require("../../assets/avatars/catia/previews/back.png"),
  },
  {
    label: "Visage",
    asset: require("../../assets/avatars/catia/previews/face.png"),
  },
];
export default function CatiaPreview() {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"3d" | "images">("3d");
  const [attempt, setAttempt] = useState(0);
  return (
    <>
      <Stack.Screen options={{ title: "Préparation de Catia" }} />
      <Page eyebrow="Atelier Vestige" title="Catia en 3D">
        <Card>
          <Badge tone="coral">Disponible sur la carte · rendu 2,5D</Badge>
          <Text style={s.body}>
            Son modèle a été optimisé en conservant la texture et la tenue
            d’origine. Les mouvements corrigés ont passé les contrôles hors
            ligne et restent à tester sur votre iPhone. La carte utilise des
            sprites transparents issus de ce GLB ; votre progression est
            conservée.
          </Text>
        </Card>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(
            [
              ["3d", "Vue 3D animée"],
              ["images", "Images de contrôle"],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === value }}
              onPress={() => {
                if (value === "3d") setAttempt((n) => n + 1);
                setMode(value);
              }}
              style={{
                flex: 1,
                minHeight: 44,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: mode === value ? colors.turquoise : colors.line,
              }}
            >
              <Text style={{ color: colors.ink, textAlign: "center" }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        {mode === "3d" && (
          <Card>
            <CatiaViewerBoundary
              key={attempt}
              onImages={() => setMode("images")}
            >
              <Suspense
                fallback={<Text style={s.body}>Préparation de la vue 3D…</Text>}
              >
                <Catia3DPreview />
              </Suspense>
            </CatiaViewerBoundary>
          </Card>
        )}
        {mode === "images" && <CatiaMotionFrames />}
        {mode === "images" && (
          <Card>
            <Image
              source={views[index].asset}
              resizeMode="contain"
              accessibilityLabel={`Catia, aperçu ${views[index].label.toLowerCase()} du modèle optimisé`}
              style={{
                width: "100%",
                height: 360,
                backgroundColor: colors.raised,
                borderRadius: 18,
              }}
            />
            <View style={{ flexDirection: "row", gap: 6 }}>
              {views.map((view, i) => (
                <Pressable
                  key={view.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: index === i }}
                  onPress={() => setIndex(i)}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    paddingVertical: 12,
                    borderBottomWidth: 2,
                    borderBottomColor:
                      index === i ? colors.turquoise : colors.line,
                  }}
                >
                  <Text style={{ color: colors.ink, textAlign: "center" }}>
                    {view.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.caption}>
              Images de contrôle calculées depuis le GLB optimisé. Cette vue ne
              simule pas un personnage 3D interactif ou une animation validée.
            </Text>
          </Card>
        )}
        <Card>
          <Text style={s.heading}>Version corrigée</Text>
          <Text style={s.body}>
            {verification.triangles.toLocaleString("fr-FR")} triangles · texture{" "}
            {status.textureWidth} × {status.textureHeight}
          </Text>
          <Text style={s.body}>
            Squelette : {status.hasSkeleton ? "créé, à contrôler" : "à créer"} ·
            Idle, Walk, Run :{" "}
            {status.actualClips.length === 3
              ? "clips expérimentaux produits"
              : "préparation en cours"}
          </Text>
          <Text style={s.caption}>
            Contrôles Blender et export/réimport GLB réussis. Le rendu temps
            réel et les performances restent à vérifier sur appareil. La course
            conserve les mains près des poches.
          </Text>
          <Text style={s.caption}>
            Le GLB reste dans ce visualiseur. Sur la carte, Catia utilise ses
            sprites transparents animés pour conserver une charge légère.
          </Text>
        </Card>
        <Card>
          <Text style={s.heading}>Avant une activation 3D temps réel</Text>
          {catiaBlockers(status).map((reason) => (
            <Text key={reason} style={s.body}>
              • {reason}
            </Text>
          ))}
          <Text style={s.caption}>
            Aucun gain d’XP ni changement de position ne peut être déclenché
            depuis cet atelier.
          </Text>
        </Card>
      </Page>
    </>
  );
}
