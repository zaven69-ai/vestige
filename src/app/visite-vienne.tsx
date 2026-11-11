import { useWalkingNavigation } from "../hooks/useWalkingNavigation";
import { WalkingNavigationPanel } from "../components/navigation/WalkingNavigationPanel";
import React, { useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  Switch,
  Alert,
  Linking,
  Modal,
  ScrollView,
} from "react-native";
import { Stack, router, useIsFocused, useLocalSearchParams } from "expo-router";
import { Page, Card, Badge, Button, ProgressBar, s } from "../components/ui";
import { useLive } from "../lib/live/LiveProvider";
import {
  vienneAntique,
  liveStories,
  liveAssets,
} from "../data/live/vienneAntique";
import { monuments } from "../data/monuments";
import { useGame } from "../lib/store";
import { distance, formatDistance } from "../lib/game";
import { usableLiveFix } from "../lib/live/geofence";
import { editoriallyApproved, playableAsset } from "../lib/live/eligibility";
import { VisitMap } from "../components/live/VisitMap";
import { useExplorationClock } from "../hooks/useExplorerSensors";
export default function VisitVienne() {
  const live = useLive(),
    focused = useIsFocused(),
    { fix, gps, requestGPS } = useGame(),
    now = useExplorationClock();
  const setVisible = live.setVisible;
  useEffect(() => {
    setVisible(focused);
    return () => setVisible(false);
  }, [focused, setVisible]);
  const session = live.session,
    stop = vienneAntique.stops[Math.min(session?.index ?? 0, 2)],
    story = liveStories.find((s) => s.id === stop.storyId)!;
  const asset = playableAsset(story, liveAssets),
    monument = monuments.find((m) => m.id === stop.poiId)!;
  const finished = session?.endedAt !== null && !!session;
  const navigation = useWalkingNavigation(
    stop.approach,
    stop.poiId,
    focused && live.foreground && !!session && !session.paused && !finished,
  );
  const { start: startNavigation } = navigation;
  const params = useLocalSearchParams<{ navigation?: string }>();
  const autostarted = useRef(false);
  const [narrationModal, setNarrationModal] = useState<string | null>(null);
  const narrationKey = session ? `${session.startedAt}:${stop.poiId}` : null;
  useEffect(() => {
    if (
      params.navigation === "marche" &&
      focused &&
      session &&
      !finished &&
      !autostarted.current
    ) {
      autostarted.current = true;
      startNavigation();
    }
  }, [params.navigation, focused, session, finished, startNavigation]);
  function automatic(value: boolean) {
    if (!value) {
      live.setMode("manual");
      return;
    }
    Alert.alert(
      "Activer le mode automatique ?",
      "Avec cet écran ouvert, GPS précis (≤ 50 m), zone de 75 m et présence de 5 s. Seules les versions approuvées disposant d’un audio peuvent être lues. Les 3 brouillons actuels restent silencieux.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Activer", onPress: () => live.setMode("automatic") },
      ],
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: "Vienne antique · visite" }} />
      <Modal
        visible={
          narrationModal !== null &&
          narrationModal === narrationKey &&
          !finished
        }
        transparent
        animationType="none"
        onRequestClose={() => setNarrationModal(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000A",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              maxHeight: "85%",
              backgroundColor: "#020D27",
              borderColor: "#CDB67C",
              borderWidth: 1,
              borderRadius: 24,
              padding: 20,
              gap: 12,
            }}
          >
            <Text accessibilityRole="header" style={s.heading}>
              {story.title}
            </Text>
            <Text style={s.caption}>
              {asset
                ? "Narration approuvée"
                : "Audio en préparation · transcription provisoire à relire"}
            </Text>
            <ScrollView>
              <Text selectable style={s.body}>
                {editoriallyApproved(story) || __DEV__
                  ? story.script
                  : "Transcription en préparation."}
              </Text>
              {story.sources.map((source) => (
                <Button
                  key={source.url}
                  title={`Source : ${source.title}`}
                  secondary
                  onPress={() =>
                    void Linking.openURL(source.url).catch(() =>
                      Alert.alert("Lien indisponible"),
                    )
                  }
                />
              ))}
            </ScrollView>
            <Button
              title={
                live.playback?.intent === "play"
                  ? "Pause audio"
                  : "Écouter la narration"
              }
              disabled={!asset || !!session?.paused}
              onPress={
                live.playback?.intent === "play" ? live.pauseAudio : live.play
              }
            />
            <Button
              title="Fermer"
              secondary
              onPress={() => setNarrationModal(null)}
            />
          </View>
        </View>
      </Modal>
      <Page eyebrow="Vestige Live · premier plan" title={vienneAntique.title}>
        {!session ? (
          <Card>
            <Text style={s.body}>
              Commencez une visite en mode manuel. Consulter ou écouter une
              étape ne donne aucun XP.
            </Text>
            <Button
              title="Commencer"
              disabled={!live.ready || !!live.storageError}
              onPress={live.begin}
            />
          </Card>
        ) : finished ? (
          <Card>
            <Badge>Visite terminée</Badge>
            <Text style={s.body}>
              {
                Object.values(session.outcomes).filter((v) => v === "listened")
                  .length
              }{" "}
              écoutée(s),{" "}
              {
                Object.values(session.outcomes).filter((v) => v === "consulted")
                  .length
              }{" "}
              consultée(s),{" "}
              {
                Object.values(session.outcomes).filter((v) => v === "skipped")
                  .length
              }{" "}
              passée(s). Aucun XP audio.
            </Text>
            <Button
              title="Nouvelle visite · mode manuel"
              onPress={live.begin}
            />
            <Button
              title="Retour aux parcours"
              secondary
              onPress={() => router.back()}
            />
          </Card>
        ) : (
          <>
            <Card>
              <Badge tone="blue">
                Étape {session.index + 1}/3 ·{" "}
                {session.paused ? "Visite en pause" : "Visite en cours"}
              </Badge>
              <ProgressBar
                value={session.index}
                max={3}
                label="Progression de la visite, sans XP"
              />
              <Text style={s.heading}>{story.title}</Text>
              <Text style={s.body}>
                {usableLiveFix(fix, now)
                  ? `${formatDistance(distance(fix, stop.approach))} du repère d’approche (à vol d’oiseau)`
                  : `${gps} · aucune arrivée validée`}
              </Text>
              <Button
                title="Autoriser / actualiser le GPS"
                secondary
                onPress={() => void requestGPS()}
              />
            </Card>
            <VisitMap
              navigation={navigation}
              selectedId={stop.poiId}
              active={focused && live.foreground && !session.paused}
              onSelect={(m) => router.push(`/monument/${m.id}`)}
            />
            <WalkingNavigationPanel
              navigation={navigation}
              destination={story.title}
              first={session.index === 0}
              last={session.index === 2}
              target={stop.approach}
              onNarration={() => setNarrationModal(narrationKey)}
              onNext={() => live.advance("consulted")}
            />
            <Card>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Text style={[s.body, { flex: 1 }]}>
                  Mode automatique{" "}
                  {live.mode === "automatic" ? "activé" : "désactivé · manuel"}
                </Text>
                <Switch
                  accessibilityLabel="Activer les narrations automatiques"
                  value={live.mode === "automatic"}
                  onValueChange={automatic}
                />
              </View>
              <Text style={s.caption}>
                Premier plan, cet écran ouvert. Quitter l’écran, verrouiller le
                téléphone ou passer en arrière-plan met la lecture en pause ;
                aucune reprise sonore automatique.
              </Text>
              <Text style={s.caption}>
                Prochaine étape automatique :{" "}
                {asset
                  ? "version approuvée et audio disponible"
                  : "non éligible · audio en préparation"}
                . Le mode automatique ne valide jamais un contenu communautaire
                ou importé.
              </Text>
            </Card>
            <Card>
              <Badge tone={asset ? "blue" : "coral"}>
                {asset
                  ? "Narration éditoriale approuvée"
                  : "Audio en préparation"}
              </Badge>
              <Text style={s.body}>
                {asset
                  ? live.playback?.status === "playing"
                    ? "Lecture en cours"
                    : live.playback?.status === "loading"
                      ? "Chargement du fichier audio"
                      : "Prêt pour une lecture manuelle"
                  : "Transcription provisoire · brouillon développeur non relu. Aucun fichier audio approuvé disponible."}
              </Text>
              <Button
                title={
                  live.playback?.intent === "play"
                    ? "Pause audio"
                    : "Lecture / reprendre"
                }
                disabled={!asset || session.paused}
                onPress={
                  live.playback?.intent === "play" ? live.pauseAudio : live.play
                }
              />
              <Button
                title="Rejouer depuis le début"
                secondary
                disabled={!asset || session.paused}
                onPress={live.replay}
              />
              <Text style={s.caption}>
                Volume : {Math.round(live.prefs.volume * 100)} % · le mode
                silencieux du téléphone est respecté.
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  title="Volume −"
                  secondary
                  onPress={() => live.setVolume(live.prefs.volume - 0.1)}
                />
                <Button
                  title="Volume +"
                  secondary
                  onPress={() => live.setVolume(live.prefs.volume + 0.1)}
                />
              </View>
              {live.audioError && <Text style={s.body}>{live.audioError}</Text>}
              <Text style={s.heading}>
                Transcription {asset ? "" : "provisoire"}
              </Text>
              <Text selectable style={s.body}>
                {editoriallyApproved(story) || __DEV__
                  ? story.script
                  : "Transcription en préparation, après relecture éditoriale."}
              </Text>
              <Text style={s.caption}>
                Version {story.version} ·{" "}
                {Math.ceil((story.script.split(/\s+/).length / 150) * 60)} s de
                lecture estimée, pas une durée audio mesurée.
              </Text>
              <Text style={s.heading}>Sources et accès</Text>
              {story.sources.map((source) => (
                <View key={source.url} style={{ gap: 6 }}>
                  <Text style={s.caption}>
                    {source.publisher} ·{" "}
                    {source.author ?? "auteur individuel non indiqué"} ·{" "}
                    {source.publishedAt ?? "date de publication non indiquée"} ·
                    consulté le {source.consultedAt}
                  </Text>
                  <Button
                    title={`Source : ${source.title}`}
                    secondary
                    onPress={() =>
                      void Linking.openURL(source.url).catch(() =>
                        Alert.alert(
                          "Lien indisponible",
                          "Réessayez avec une connexion Internet.",
                        ),
                      )
                    }
                  />
                </View>
              ))}
              <Text style={s.body}>{stop.access}</Text>
              <Text style={s.caption}>
                Repère de la fiche officielle consultée le {stop.checkedAt}, à
                confirmer sur place ; aucune garantie d’ouverture en temps réel.
                Respectez les voies publiques et la signalisation.
              </Text>
              <Button
                title="Ouvrir la fiche du monument"
                secondary
                onPress={() => router.push(`/monument/${monument.id}`)}
              />
            </Card>
            <Card>
              <Button
                title="Étape consultée · suivante"
                disabled={!!live.storageError || session.paused}
                onPress={() => live.advance("consulted")}
              />
              <Button
                title="Passer cette étape"
                secondary
                disabled={!!live.storageError || session.paused}
                onPress={() => live.advance("skipped")}
              />
              <Button
                title={
                  session.paused
                    ? "Reprendre la visite"
                    : "Mettre la visite en pause"
                }
                secondary
                onPress={live.togglePause}
              />
              <Button
                title="Terminer la visite"
                secondary
                onPress={() =>
                  Alert.alert(
                    "Terminer la visite ?",
                    "La progression de visite sera conservée, sans modification des XP.",
                    [
                      { text: "Continuer", style: "cancel" },
                      { text: "Terminer", onPress: live.finish },
                    ],
                  )
                }
              />
            </Card>
          </>
        )}
        {live.storageError && (
          <Card>
            <Text style={s.body}>{live.storageError}</Text>
          </Card>
        )}
      </Page>
    </>
  );
}
