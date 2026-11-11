import React, { useState } from "react";
import { View, Text, ScrollView, Linking, Alert } from "react-native";
import { router } from "expo-router";
import { Button, s } from "../ui";
import type { ExplorerGuidance } from "../../hooks/useExplorerGuidance";
import { playableAsset, editoriallyApproved } from "../../lib/live/eligibility";
import { liveAssets } from "../../data/live/vienneAntique";
export function GuidedVisitFooter({
  guide,
  onNext,
  onListen,
}: {
  guide: ExplorerGuidance;
  onNext: () => void;
  onListen?: () => void;
}) {
  const [reading, setReading] = useState(false);
  const { story, live, session, tour } = guide;
  const asset = story ? playableAsset(story, liveAssets) : null;
  return (
    <View
      style={{ borderTopWidth: 1, borderColor: "#B89B5E", padding: 12, gap: 8 }}
    >
      {tour.community && (
        <Text style={s.caption}>
          Parcours proposé par {tour.community.author} · communauté · non
          vérifié. Aucune narration automatique de ce contenu.
        </Text>
      )}
      {guide.stop.history && (
        <ScrollView
          style={{ maxHeight: 200 }}
          contentContainerStyle={{ gap: 8 }}
        >
          <Text style={s.heading}>{guide.stop.history.title}</Text>
          <Text style={s.body}>{guide.stop.history.text}</Text>
          <Text style={s.caption}>{guide.stop.access}</Text>
          <Text style={s.caption}>
            Notice documentée · sources contrôlées le{" "}
            {guide.stop.history.checkedAt}. Audio en préparation ; aucune
            approbation audio déduite.
          </Text>
          {guide.stop.history.sources.map((url) => (
            <Text
              key={url}
              accessibilityRole="link"
              style={{ color: "#64CFD0", paddingVertical: 6 }}
              onPress={() =>
                void Linking.openURL(url).catch(() =>
                  Alert.alert("Source indisponible"),
                )
              }
            >
              Source ↗ {url}
            </Text>
          ))}
        </ScrollView>
      )}
      <Text style={s.caption}>
        {live.preview ? "MODE TEST · progression non sauvegardée · " : ""}
        {tour.title} · étape {(session?.index ?? 0) + 1}/{tour.stops.length} ·{" "}
        {asset
          ? "Narration approuvée"
          : story
            ? "Audio en préparation"
            : "Narration non disponible pour cette étape"}
      </Text>
      {reading && story && (
        <ScrollView
          style={{ maxHeight: 180 }}
          contentContainerStyle={{ gap: 8 }}
        >
          <Text selectable style={s.body}>
            {editoriallyApproved(story) || __DEV__
              ? story.script
              : "Transcription en préparation après validation éditoriale."}
          </Text>
          <Text style={s.caption}>
            Version {story.version} ·{" "}
            {editoriallyApproved(story)
              ? "approuvée"
              : "brouillon développeur non relu"}
          </Text>
          {story.sources.map((source) => (
            <Text
              accessibilityRole="link"
              key={source.url}
              onPress={() =>
                void Linking.openURL(source.url).catch(() =>
                  Alert.alert("Lien indisponible"),
                )
              }
              style={{ color: "#64CFD0", paddingVertical: 8 }}
            >
              {source.title} · {source.publisher} · consulté le{" "}
              {source.consultedAt}
            </Text>
          ))}
        </ScrollView>
      )}
      {story && (
        <Button
          title={reading ? "Réduire la transcription" : "Lire la narration"}
          secondary
          onPress={() => setReading((v) => !v)}
        />
      )}
      {!asset && <Text style={s.caption}>Audio en préparation</Text>}
      {asset && (
        <Button
          title={
            live.playback?.storyId === story?.id &&
            live.playback?.intent === "play"
              ? "Pause audio"
              : "Écouter / reprendre"
          }
          disabled={session?.paused}
          onPress={
            live.playback?.storyId === story?.id &&
            live.playback?.intent === "play"
              ? live.pauseAudio
              : () => {
                  if (live.playback?.storyId === story?.id) live.play();
                  else live.playPoi(guide.stop.poiId);
                  onListen?.();
                }
          }
        />
      )}
      {live.audioError && <Text style={s.caption}>{live.audioError}</Text>}
      {tour.presenceRequired && !live.preview && !guide.navigation.arrived && (
        <Text style={s.caption}>
          Approchez le repère avec un GPS précis pour valider cette étape. Vous
          pouvez aussi l’ignorer depuis les options du guidage.
        </Text>
      )}
      {(session?.index ?? 0) === tour.stops.length - 1 && (
        <Button
          secondary
          title="Partager ma découverte de cette étape"
          onPress={() =>
            router.push({
              pathname: "/communaute/creer",
              params: { kind: "discovery", poi: guide.stop.poiId },
            })
          }
        />
      )}
      <Button
        title={
          (session?.index ?? 0) === tour.stops.length - 1
            ? "Terminer le parcours"
            : "Étape suivante"
        }
        disabled={
          !!session?.paused ||
          !!live.storageError ||
          (!!tour.presenceRequired &&
            !live.preview &&
            !guide.navigation.arrived)
        }
        onPress={onNext}
      />
    </View>
  );
}
