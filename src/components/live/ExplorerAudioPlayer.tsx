import { georgePrivateTranscript } from "../../data/live/georgePrivateTranscript";
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLive } from "../../lib/live/LiveProvider";
import { audioTime } from "../../lib/live/audioPlayback";
import { Button, Icon, s } from "../ui";
import { SimulationNotice } from "../developer/SimulationBanner";
export function ExplorerAudioPlayer() {
  const live = useLive(),
    insets = useSafeAreaInsets();
  const [details, setDetails] = useState(false);
  const p = live.playback,
    story = live.audioStory;
  if (!p || !story) return null;
  const demo = "transcript" in story;
  const capsule = p.kind === "georges-demo";
  const text = demo
    ? capsule
      ? story.transcript
      : (georgePrivateTranscript ?? story.transcript)
    : story.script;
  const progress = p.duration > 0 ? Math.min(1, p.position / p.duration) : 0;
  const open = (url: string) =>
    void Linking.openURL(url).catch(() => Alert.alert("Source indisponible"));
  return (
    <>
      <View
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: insets.bottom + 94,
          padding: 12,
          borderRadius: 18,
          backgroundColor: "#07152CF5",
          borderWidth: 1,
          borderColor: "#C6A86A",
          gap: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir transcription et sources audio"
            onPress={() => setDetails(true)}
            style={{ flex: 1 }}
          >
            <Text
              numberOfLines={1}
              style={{ color: "#F2D9A0", fontSize: 14, fontWeight: "700" }}
            >
              {story.title}
            </Text>
            <Text style={{ color: "#B6C5D8", fontSize: 11 }}>
              {capsule
                ? "Georges · Démo d’arrivée"
                : demo
                  ? "George · Démonstration non approuvée"
                  : "Narration approuvée"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer et arrêter le lecteur audio"
            onPress={() => {
              setDetails(false);
              live.closeAudio();
            }}
            style={{
              minHeight: 44,
              minWidth: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={20} />
          </Pressable>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(progress * 100),
          }}
          style={{ height: 3, backgroundColor: "#243956", borderRadius: 2 }}
        >
          <View
            style={{
              height: 3,
              width: `${progress * 100}%`,
              backgroundColor: "#E8CD8E",
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
          <Text style={{ color: "#B6C5D8", fontSize: 11 }}>
            {audioTime(p.position)} /{" "}
            {p.duration ? audioTime(p.duration) : "--:--"}
          </Text>
          <Control
            label={
              p.status === "loading"
                ? "Chargement…"
                : live.audioError
                  ? "Réessayer"
                  : p.intent === "play"
                    ? "Pause"
                    : p.ended
                      ? "Réécouter"
                      : "Reprendre"
            }
            onPress={
              p.intent === "play" && !live.audioError
                ? live.pauseAudio
                : live.play
            }
          />
          <Control label="Rejouer" onPress={live.replay} />
          <Control label="Texte" onPress={() => setDetails(true)} />
        </View>
        {!!live.audioError && (
          <Text
            accessibilityRole="alert"
            style={{ color: "#FFC6AB", fontSize: 12 }}
          >
            {live.audioError}
          </Text>
        )}
      </View>
      <Modal
        visible={details}
        transparent
        animationType="slide"
        onRequestClose={() => setDetails(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#0008",
          }}
        >
          <View
            style={{
              maxHeight: "85%",
              backgroundColor: "#07152C",
              padding: 20,
              paddingBottom: Math.max(20, insets.bottom),
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              gap: 12,
            }}
          >
            <SimulationNotice />
            <Text style={s.heading}>{story.title}</Text>
            <Text style={s.caption}>
              {demo
                ? story.warning
                : `Script approuvé · version ${story.version}`}
            </Text>
            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
              <Text selectable style={s.body}>
                {text ||
                  "Transcription non fournie. Importez le texte exact du MP3 pour pouvoir le consulter ici ; aucun texte n’est inventé."}
              </Text>
              {demo && !capsule && (
                <Text style={s.caption}>
                  Transcription{" "}
                  {story.transcriptStatus === "automatic_unreviewed"
                    ? "automatique provisoire, non relue"
                    : "non approuvée"}
                  . Les références ci-dessous ne valident pas les affirmations
                  de cet audio.
                </Text>
              )}
              {story.sources.map((source) => (
                <Button
                  key={source.url}
                  secondary
                  title={source.title}
                  onPress={() => open(source.url)}
                />
              ))}
              <Text style={s.caption}>
                Premier plan uniquement. Le mode silencieux de l’iPhone est
                respecté : désactivez-le et augmentez le volume pour écouter.
                Aucun XP attribué par écoute.
              </Text>
              <Button
                title="Fermer la transcription"
                onPress={() => setDetails(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
function Control({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 6 }}
    >
      <Text style={{ color: "#75D3D3", fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}
