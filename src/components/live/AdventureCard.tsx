import React, { useState } from "react";
import { View, Text, Linking, Alert } from "react-native";
import { router } from "expo-router";
import type { Adventure } from "../../lib/adventures";
import { playableAdventure } from "../../lib/adventures";
import { monuments } from "../../data/monuments";
import { useLive } from "../../lib/live/LiveProvider";
import { Badge, Button, s } from "../ui";
export function AdventureCard({
  adventure: a,
  index,
}: {
  adventure: Adventure;
  index: number;
}) {
  const live = useLive(),
    [expanded, setExpanded] = useState(false);
  const playable =
    playableAdventure(a) &&
    a.steps.every((step) => monuments.some((m) => m.id === step.poiId));
  const prior =
    live.session?.tourId === a.id ? live.session : live.savedVisit(a.id);
  const resume = prior && prior.endedAt === null;
  return (
    <View style={[s.card, { gap: 12 }]}>
      <View
        accessibilityLabel={`Illustration originale : ${a.title}`}
        style={{
          height: 110,
          borderRadius: 16,
          backgroundColor: "#0B2341",
          borderWidth: 1,
          borderColor: "#A98B4E",
          padding: 16,
          overflow: "hidden",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            right: -12,
            top: -30,
            width: 160,
            height: 160,
            borderRadius: 80,
            borderWidth: 2,
            borderColor: "#796747",
          }}
        />
        <Text style={{ color: "#E3C88E", fontSize: 38, fontWeight: "700" }}>
          {String(index + 1).padStart(2, "0")}
        </Text>
        <Text style={{ color: "#B7CDE0", fontSize: 12 }}>
          LES AVENTURES DE LYON
        </Text>
      </View>
      <Badge tone={playable ? "turquoise" : "coral"}>
        {playable ? "Publié · parcours documenté" : "Bientôt · en préparation"}
      </Badge>
      <Text style={s.heading}>{a.title}</Text>
      <Text style={s.body}>{a.summary}</Text>
      <Text style={s.caption}>
        {a.period} · {a.audience}
      </Text>
      <Text style={s.caption}>
        {a.difficulty} ·{" "}
        {playable ? `${a.steps.length} étapes` : "Étapes non publiées"}
      </Text>
      <Text style={s.caption}>
        {playable
          ? "Distance et durée calculées par le guidage après démarrage. Escaliers et accès sur place à vérifier ; parcours non garanti accessible PMR."
          : "Aucune visite complète ni récit non vérifié proposé."}
      </Text>
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {a.badges.map((b) => (
          <Badge key={b}>{b}</Badge>
        ))}
      </View>
      {playable && (
        <>
          <Button
            title={expanded ? "Réduire les étapes" : "Étapes et sources"}
            secondary
            onPress={() => setExpanded((v) => !v)}
          />
          {expanded &&
            a.steps.map((step, i) => (
              <View key={step.poiId} style={{ gap: 6 }}>
                <Text style={s.heading}>
                  {i + 1}. {step.title}
                </Text>
                <Text style={s.body}>{step.text}</Text>
                <Text style={s.caption}>{step.access}</Text>
                {step.sources.map((url) => (
                  <Button
                    key={url}
                    title="Consulter la source ↗"
                    secondary
                    onPress={() =>
                      void Linking.openURL(url).catch(() =>
                        Alert.alert("Source indisponible"),
                      )
                    }
                  />
                ))}
              </View>
            ))}
          <Text style={s.caption}>
            Audio en préparation · les badges ci-dessus décrivent le parcours et
            ne constituent pas des récompenses. Aucun XP par écoute ou simple
            progression d’étape.
          </Text>
        </>
      )}
      <Button
        title={
          playable
            ? resume
              ? "Reprendre dans Explorer"
              : "Commencer"
            : "Bientôt"
        }
        disabled={!playable || !live.ready || !!live.storageError}
        onPress={() => {
          if (!playable) return;
          live.begin(a.id);
          router.navigate({
            pathname: "/(tabs)",
            params: { guide: "start", command: String(Date.now()) },
          });
        }}
      />
    </View>
  );
}
