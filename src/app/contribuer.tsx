import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, Badge, s, colors } from "../components/ui";
import { monuments } from "../data/monuments";
import { useGame } from "../lib/store";
import { useExplorationClock } from "../hooks/useExplorerSensors";
import { isFreshFix } from "../lib/exploration";
import { categoryLabels, poiCategories, poiCategory } from "../lib/poi";
import {
  coordinate,
  newDraft,
  validateDraft,
  kindLabels,
  type Draft,
  type ContributionKind,
} from "../lib/contributions/model";
import { communityStore } from "../lib/contributions/native";
import { pickDraftPhoto } from "../lib/contributions/photos";
function Field({
  label,
  value,
  onChange,
  multiline = false,
  limit = 4000,
  numeric = false,
  url = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  limit?: number;
  numeric?: boolean;
  url?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.body}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        maxLength={limit}
        keyboardType={
          numeric
            ? Platform.OS === "ios"
              ? "numbers-and-punctuation"
              : "default"
            : "default"
        }
        autoCapitalize={numeric || url ? "none" : "sentences"}
        autoCorrect={!numeric && !url}
        style={{
          backgroundColor: colors.raised,
          color: colors.ink,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 14,
          padding: 14,
          minHeight: multiline ? 110 : 48,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
function Check({
  title,
  value,
  onPress,
}: {
  title: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      onPress={onPress}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Text style={{ color: colors.turquoise, fontSize: 22 }}>
        {value ? "☑" : "☐"}
      </Text>
      <Text style={[s.body, { flex: 1 }]}>{title}</Text>
    </Pressable>
  );
}
export default function Contribuer() {
  const map = useRef<MapView>(null);
  const params = useLocalSearchParams<{
    id?: string;
    poiId?: string;
    kind?: string;
  }>();
  const { fix } = useGame();
  const [initialFix] = useState(fix);
  const now = useExplorationClock();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Draft | null>(null),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (params.id) {
          const state = await communityStore.read();
          const saved = state.drafts.find((d) => d.id === params.id);
          if (!saved) throw Error("Ce brouillon est introuvable.");
          if (active) setDraft(saved);
        } else {
          const poi = monuments.find((m) => m.id === params.poiId);
          if (params.poiId && !poi) throw Error("Ce lieu est introuvable.");
          const seed = newDraft(
            isFreshFix(initialFix, Date.now()) ? initialFix : undefined,
            poi ? { ...poi, category: poiCategory(poi) } : undefined,
          );
          if (params.kind === "report" && poi) seed.kind = "report";
          if (active) setDraft(seed);
        }
      } catch {
        if (active)
          setError(
            "Impossible de charger le brouillon. Les données locales sont conservées.",
          );
      }
    })();
    return () => {
      active = false;
    };
    // GPS is only a suggestion when creating the draft, not a live editor input.
  }, [params.id, params.poiId, params.kind, initialFix]);
  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setError("");
  }
  async function save() {
    if (!draft || busy) return;
    setBusy(true);
    try {
      await communityStore.save({
        ...draft,
        status: "draft",
        updatedAt: new Date().toISOString(),
      });
      Alert.alert(
        "Brouillon enregistré sur cet iPhone",
        "Il n’est ni envoyé ni publié. Aucun XP attribué.",
        [
          { text: "Continuer" },
          {
            text: "Mes contributions",
            onPress: () => router.push("/contributions"),
          },
        ],
      );
    } catch {
      setError(
        "Enregistrement impossible. Réessayez avant de quitter cet écran.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function photo() {
    if (!draft || busy) return;
    setBusy(true);
    try {
      const result = await pickDraftPhoto(draft.id);
      if (result)
        setDraft((current) =>
          current && current.id === draft.id
            ? { ...current, ...result, photoRights: false }
            : current,
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo indisponible.");
    } finally {
      setBusy(false);
    }
  }
  const errors = draft ? validateDraft(draft) : {};
  const lat = draft ? coordinate(draft.latitude) : NaN,
    lon = draft ? coordinate(draft.longitude) : NaN;
  const position =
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    Number.isFinite(lon) &&
    Math.abs(lon) <= 180
      ? { latitude: lat, longitude: lon }
      : null;
  function next() {
    const fields =
      step === 0
        ? ["name", "category", "position"]
        : step === 1
          ? ["kind", "content", "date"]
          : ["sources", "photo", "rights", "privacy"];
    const message = fields
      .map((k) => errors[k])
      .filter(Boolean)
      .join("\n");
    if (message) setError(message);
    else {
      setError("");
      setStep(step + 1);
    }
  }
  return (
    <KeyboardAvoidingView
      style={s.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Contribuer à Vestige" }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom, 20),
          gap: 18,
        }}
      >
        <Badge tone="coral">Brouillon privé · publication indisponible</Badge>
        <Text style={s.title}>Enrichir la mémoire des lieux</Text>
        <Text style={s.body}>
          Préparez votre proposition sur cet iPhone. L’envoi et la modération ne
          sont pas encore ouverts. Enregistrez votre brouillon avant de quitter.
        </Text>
        {error && (
          <Text accessibilityRole="alert" style={{ color: colors.coral }}>
            {error}
          </Text>
        )}
        {draft && (
          <>
            <Text accessibilityRole="header" style={s.heading}>
              {step + 1}/4 ·{" "}
              {
                [
                  "Le lieu",
                  "Votre proposition",
                  "Sources et photo",
                  "Aperçu privé",
                ][step]
              }
            </Text>
            {step === 0 && (
              <>
                <Field
                  label="Nom du lieu"
                  value={draft.name}
                  onChange={(v) => update("name", v)}
                  limit={200}
                />
                <Text style={s.eyebrow}>Catégorie</Text>
                {poiCategories.map((category) => (
                  <Button
                    key={category}
                    secondary={draft.category !== category}
                    title={categoryLabels[category]}
                    onPress={() => update("category", category)}
                  />
                ))}
                <Text style={s.body}>
                  Position du lieu proposé, distincte de votre explorateur.
                  Touchez la carte pour déplacer le repère. Cela ne déplace pas
                  votre GPS.
                </Text>
                <MapView
                  ref={map}
                  style={{ height: 250, borderRadius: 18 }}
                  userInterfaceStyle="dark"
                  initialRegion={{
                    ...(position ?? { latitude: 45.5254, longitude: 4.878 }),
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  onPress={(event) =>
                    setDraft({
                      ...draft,
                      latitude:
                        event.nativeEvent.coordinate.latitude.toFixed(6),
                      longitude:
                        event.nativeEvent.coordinate.longitude.toFixed(6),
                    })
                  }
                >
                  {position && (
                    <Marker
                      coordinate={position}
                      draggable
                      onDragEnd={(event) =>
                        setDraft({
                          ...draft,
                          latitude:
                            event.nativeEvent.coordinate.latitude.toFixed(6),
                          longitude:
                            event.nativeEvent.coordinate.longitude.toFixed(6),
                        })
                      }
                    />
                  )}
                </MapView>
                <Field
                  label="Latitude du lieu"
                  value={draft.latitude}
                  onChange={(v) => update("latitude", v)}
                  numeric
                  limit={20}
                />
                <Field
                  label="Longitude du lieu"
                  value={draft.longitude}
                  onChange={(v) => update("longitude", v)}
                  numeric
                  limit={20}
                />
                {position && (
                  <Button
                    secondary
                    title="Voir ce point sur la carte"
                    onPress={() =>
                      map.current?.animateToRegion(
                        {
                          ...position,
                          latitudeDelta: 0.02,
                          longitudeDelta: 0.02,
                        },
                        250,
                      )
                    }
                  />
                )}
                {isFreshFix(fix, now) && (
                  <Button
                    secondary
                    title="Proposer ma position GPS actuelle"
                    onPress={() =>
                      setDraft({
                        ...draft,
                        latitude: String(fix.latitude),
                        longitude: String(fix.longitude),
                      })
                    }
                  />
                )}
              </>
            )}
            {step === 1 && (
              <>
                {draft.poiId && (
                  <>
                    <Text style={s.eyebrow}>Type de proposition</Text>
                    {(
                      [
                        "correction",
                        "photo",
                        "anecdote",
                        "date",
                        "report",
                      ] as ContributionKind[]
                    ).map((kind) => (
                      <Button
                        key={kind}
                        secondary={draft.kind !== kind}
                        title={kindLabels[kind]}
                        onPress={() => update("kind", kind)}
                      />
                    ))}
                  </>
                )}
                {draft.kind === "date" && (
                  <Field
                    label="Date ou période documentée"
                    value={draft.historicalDate ?? ""}
                    onChange={(value) => update("historicalDate", value)}
                    limit={100}
                  />
                )}
                <Field
                  label={
                    draft.kind === "report"
                      ? "Décrivez le problème"
                      : draft.kind === "photo"
                        ? "Légende ou information historique (facultatif)"
                        : "Description, correction ou information historique"
                  }
                  value={draft.content}
                  onChange={(v) => update("content", v)}
                  multiline
                />
                <Text style={s.caption}>
                  Une anecdote, une date ou une affirmation historique doit être
                  accompagnée d’une référence. La fiche publique reste
                  inchangée.
                </Text>
              </>
            )}
            {step === 2 && (
              <>
                <Field
                  label="Sources HTTPS · un lien par ligne, maximum 5"
                  url
                  value={draft.sources}
                  onChange={(v) => update("sources", v)}
                  multiline
                  limit={2000}
                />
                <Field
                  label="Pseudo public souhaité (facultatif)"
                  value={draft.alias}
                  onChange={(v) => update("alias", v)}
                  limit={40}
                />
                <Button
                  title={busy ? "Ouverture…" : "Choisir une photo"}
                  secondary
                  disabled={busy}
                  onPress={() => void photo()}
                />
                {draft.photoUri && (
                  <>
                    <Image
                      source={{ uri: draft.photoUri }}
                      style={{ height: 220, width: "100%", borderRadius: 18 }}
                      resizeMode="contain"
                      accessibilityLabel="Photo du brouillon privé"
                    />
                    <Button
                      secondary
                      title="Retirer la photo de ce brouillon"
                      onPress={() =>
                        setDraft({
                          ...draft,
                          photoUri: undefined,
                          photoBytes: undefined,
                          photoMime: undefined,
                          photoRights: false,
                        })
                      }
                    />
                    <Field
                      label="Auteur et attribution de la photo"
                      value={draft.attribution}
                      onChange={(v) => update("attribution", v)}
                      limit={300}
                    />
                    <Field
                      label="Licence ou droits que vous accordez"
                      value={draft.license}
                      onChange={(v) => update("license", v)}
                      limit={200}
                    />
                    <Check
                      title="Je possède les droits nécessaires pour proposer cette photo."
                      value={draft.photoRights}
                      onPress={() => update("photoRights", !draft.photoRights)}
                    />
                  </>
                )}
                <Text style={s.body}>
                  Évitez visages identifiables, plaques, adresses privées et
                  personnes sans accord. Une photo peut contenir des métadonnées
                  de localisation. Elle reste locale ; aucune suppression de
                  métadonnées n’est garantie ici.
                </Text>
                <Check
                  title="J’ai vérifié les données personnelles et la localisation proposées."
                  value={draft.privacyConsent}
                  onPress={() =>
                    update("privacyConsent", !draft.privacyConsent)
                  }
                />
              </>
            )}
            {step === 3 && (
              <Card>
                <Text style={s.heading}>{draft.name}</Text>
                <Text style={s.body}>
                  {kindLabels[draft.kind]} · {categoryLabels[draft.category]}
                </Text>
                {!!draft.historicalDate && (
                  <Text style={s.body}>
                    Date proposée : {draft.historicalDate}
                  </Text>
                )}
                <Text style={s.caption}>
                  {draft.latitude}, {draft.longitude}
                </Text>
                <Text style={s.body}>
                  {draft.content || "Photo sans affirmation historique"}
                </Text>
                <Text selectable style={s.body}>
                  {draft.sources || "Aucune référence historique ajoutée"}
                </Text>
                {draft.photoUri && (
                  <Image
                    source={{ uri: draft.photoUri }}
                    style={{ height: 180, width: "100%" }}
                    resizeMode="contain"
                  />
                )}
                <Text style={s.caption}>
                  {draft.alias
                    ? `Pseudo souhaité : ${draft.alias}`
                    : "Aucun pseudo choisi"}
                  {draft.photoUri
                    ? ` · ${draft.attribution} · ${draft.license}`
                    : ""}
                </Text>
                <Button
                  title="Soumettre · bientôt disponible"
                  disabled
                  onPress={() => {}}
                />
                <Text style={s.body}>
                  Publication indisponible. L’envoi sera ouvert après mise en
                  place de la vérification des contributions. Votre brouillon
                  n’apparaît pas sur la carte publique et ne rapporte aucun XP.
                </Text>
              </Card>
            )}
            <View style={{ flexDirection: "row", gap: 12 }}>
              {step > 0 && (
                <View style={{ flex: 1 }}>
                  <Button
                    title="Précédent"
                    secondary
                    onPress={() => {
                      setStep(step - 1);
                      setError("");
                    }}
                  />
                </View>
              )}
              {step < 3 && (
                <View style={{ flex: 1 }}>
                  <Button title="Continuer" onPress={next} />
                </View>
              )}
            </View>
            <Button
              title={
                busy ? "Enregistrement…" : "Enregistrer le brouillon local"
              }
              secondary
              disabled={busy}
              onPress={() => void save()}
            />
            <Button
              title="Mes contributions"
              secondary
              onPress={() => router.push("/contributions")}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
