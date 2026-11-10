import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Page, Card, Badge, s, colors } from "../components/ui";
import status from "../data/avatars/catia.json";
import { catiaBlockers } from "../lib/avatars/catia";
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
  return (
    <>
      <Stack.Screen options={{ title: "Préparation de Catia" }} />
      <Page eyebrow="Atelier Vestige" title="Catia prend forme">
        <Card>
          <Badge tone="coral">Non activée sur la carte</Badge>
          <Text style={s.body}>
            Son modèle a été optimisé en conservant la texture et la tenue
            d’origine. Le squelette et les mouvements restent expérimentaux.
            Votre explorateur actuel et votre progression sont conservés.
          </Text>
        </Card>
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
        <Card>
          <Text style={s.heading}>Préparation technique</Text>
          <Text style={s.body}>
            {status.optimizedTriangles.toLocaleString("fr-FR")} triangles ·
            texture {status.textureWidth} × {status.textureHeight}
          </Text>
          <Text style={s.body}>
            Squelette : {status.hasSkeleton ? "créé, à contrôler" : "à créer"} ·
            Idle, Walk, Run :{" "}
            {status.actualClips.length === 3
              ? "clips expérimentaux produits"
              : "préparation en cours"}
          </Text>
          {status.qualityIssues.map((issue) => (
            <Text key={issue} style={s.caption}>
              {issue}
            </Text>
          ))}
          <Text style={s.caption}>
            Ces fichiers ne sont pas chargés sur la carte. L’aperçu reste léger
            et compatible avec Expo Go.
          </Text>
        </Card>
        <Card>
          <Text style={s.heading}>Avant l’activation</Text>
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
