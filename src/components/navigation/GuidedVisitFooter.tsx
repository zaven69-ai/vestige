import React, { useState } from "react";
import { View, Text, ScrollView, Linking, Alert } from "react-native";
import { Button, s } from "../ui";
import type { ExplorerGuidance } from "../../hooks/useExplorerGuidance";
import { playableAsset, editoriallyApproved } from "../../lib/live/eligibility";
import { liveAssets } from "../../data/live/vienneAntique";
export function GuidedVisitFooter({
  guide,
  onNext,
}: {
  guide: ExplorerGuidance;
  onNext: () => void;
}) {
  const [reading, setReading] = useState(false);
  const { story, live, session, tour } = guide;
  const asset = story ? playableAsset(story, liveAssets) : null;
  return (
    <View
      style={{ borderTopWidth: 1, borderColor: "#B89B5E", padding: 12, gap: 8 }}
    >
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
      {asset && (
        <Button
          title={
            live.playback?.intent === "play"
              ? "Pause audio"
              : "Écouter / reprendre"
          }
          disabled={session?.paused}
          onPress={
            live.playback?.intent === "play" ? live.pauseAudio : live.play
          }
        />
      )}
      {live.audioError && <Text style={s.caption}>{live.audioError}</Text>}
      <Button
        title={
          (session?.index ?? 0) === tour.stops.length - 1
            ? "Terminer le parcours"
            : "Étape suivante"
        }
        disabled={!!session?.paused || !!live.storageError}
        onPress={onNext}
      />
    </View>
  );
}
