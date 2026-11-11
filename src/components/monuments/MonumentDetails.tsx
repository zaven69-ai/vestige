import { useExplorationLocation } from "../../hooks/useExplorationLocation";
import { useLive } from "../../lib/live/LiveProvider";
import { MonumentActions } from "../contributions/MonumentActions";
import { PoiBadge } from "../poi/PoiBadge";
import { isPublicPoi, poiStatus } from "../../lib/poi";
import { MonumentPhoto } from "../MonumentPhoto";
import { monuments } from "../../data/monuments";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import type { Monument } from "../../data/monuments";
import { useGame } from "../../lib/store";
import {
  canDiscover,
  distance,
  formatDistance,
  levelFor,
} from "../../lib/game";
import { Badge, Button, Card, colors, s } from "../ui";
import { theme } from "../../theme";
import { DiscoveryNotice, type DiscoveryReceipt } from "./DiscoveryNotice";
export function MonumentDetails({
  monument,
  onNavigate,
}: {
  monument: Monument;
  onNavigate?: () => void;
}) {
  const { journal, discover, requestGPS, ready, storageError, xp } = useGame();
  const location = useExplorationLocation();
  const { fix } = location;
  const live = useLive();
  const [tab, setTab] = useState<"about" | "contributions" | "sources">(
    "about",
  );
  const contribute = (kind?: string) => {
    onNavigate?.();
    router.push({
      pathname: "/contribuer",
      params: { poiId: monument.id, ...(kind ? { kind } : {}) },
    });
  };
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<DiscoveryReceipt | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const review = poiStatus(monument);
  const verified =
    review === "editorial_verified" || review === "community_verified";
  const found = !!journal[monument.id],
    eligible = !location.enabled && canDiscover(fix, monument, now);
  const open = (url: string) => {
    void Linking.openURL(url).catch(() =>
      Alert.alert("Lien indisponible", "Vérifiez votre connexion Internet."),
    );
  };
  async function claim() {
    if (busy) return;
    setBusy(true);
    const previousLevel = levelFor(xp);
    const result = await discover(monument.id);
    setBusy(false);
    if (result === "ok")
      setReceipt({
        title: monument.name,
        xp: monument.xp,
        previousLevel,
        nextLevel: levelFor(xp + monument.xp),
      });
    else
      Alert.alert(
        "Découverte non validée",
        result === "simulation"
          ? "Mode test : aucune découverte ni récompense réelle ne peut être enregistrée."
          : result === "gps"
            ? "Approchez-vous à moins de 100 m avec un relevé de moins de 30 secondes et une précision de 50 m ou mieux."
            : result === "already"
              ? "Ce monument figure déjà dans votre carnet."
              : "Le carnet ne peut pas être sauvegardé pour le moment.",
      );
  }
  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.space.xxl }}>
        <MonumentPhoto
          monument={monument}
          style={{ height: 220, width: "100%" }}
        />
        <View style={{ padding: theme.space.lg, gap: theme.space.lg }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: theme.space.xs,
            }}
          >
            <Badge tone="blue">{monument.city}</Badge>
            <Badge>{monument.era}</Badge>
            {monument.category && <Badge>{monument.category}</Badge>}
            <Badge tone={found ? "turquoise" : "coral"}>
              {found ? "Découvert ✓" : `+${monument.xp} XP`}
            </Badge>
          </View>
          <PoiBadge poi={monument} />
          <Text accessibilityRole="header" style={s.title}>
            {monument.name}
          </Text>
          {location.enabled && (
            <Text accessibilityRole="alert" style={s.body}>
              MODE TEST — GPS SIMULÉ · découvertes et XP désactivés.
            </Text>
          )}
          <Button
            title={
              location.enabled ? "M’y rendre · trajet de test" : "M’y rendre"
            }
            disabled={!live.ready || !!live.storageError}
            onPress={() => {
              live.begin(`poi:${monument.id}`);
              onNavigate?.();
              router.navigate({
                pathname: "/(tabs)",
                params: { guide: "start", command: String(Date.now()) },
              });
            }}
          />
          <MonumentActions
            monument={monument}
            contribute={() => contribute()}
            report={() => contribute("report")}
          />
          <View
            accessibilityRole="tablist"
            style={{ flexDirection: "row", gap: 8 }}
          >
            {(
              [
                ["about", "À propos"],
                ["contributions", "Contributions"],
                ["sources", "Sources"],
              ] as const
            ).map(([id, label]) => (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === id }}
                onPress={() => setTab(id)}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderBottomWidth: 2,
                  borderBottomColor:
                    tab === id ? colors.turquoise : colors.line,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.ink,
                    textAlign: "center",
                    fontSize: 12,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          {tab === "contributions" && (
            <Card>
              <Text style={s.heading}>Enrichir cette fiche</Text>
              <Text style={s.body}>
                Aucune contribution communautaire publiée n’est disponible pour
                ce lieu. Vous pouvez préparer une photo, une correction, une
                anecdote sourcée ou un repère chronologique. Votre proposition
                restera un brouillon privé tant que l’envoi et la modération ne
                sont pas ouverts.
              </Text>
              <Button
                title="Préparer une contribution"
                onPress={() => contribute()}
              />
              <Button
                title="Mes brouillons privés"
                secondary
                onPress={() => {
                  onNavigate?.();
                  router.push("/contributions");
                }}
              />
            </Card>
          )}
          {tab === "about" && (
            <>
              <Card>
                <Text style={s.heading}>
                  {found
                    ? "Une page de votre histoire"
                    : "À vous de découvrir ce lieu"}
                </Text>
                <Text style={s.body}>
                  {found
                    ? `Découvert le ${new Date(journal[monument.id]).toLocaleDateString("fr-FR")}`
                    : location.enabled && fix
                      ? `${formatDistance(distance(fix, monument))} depuis la position simulée. Aucune découverte réelle ne sera validée.`
                      : fix
                        ? `${formatDistance(distance(fix, monument))} depuis le dernier relevé · précision ${fix.accuracy === null ? "indisponible" : `±${Math.round(fix.accuracy)} m`}. Validation dans un rayon de 100 m avec un GPS récent et précis.`
                        : "Activez votre position. L’histoire du lieu reste accessible partout."}
                </Text>
                {storageError && (
                  <Text accessibilityRole="alert" style={s.body}>
                    {storageError}
                  </Text>
                )}
                {!location.enabled &&
                  (!fix || now - fix.timestamp >= 30000) &&
                  !found && (
                    <Button
                      title={
                        fix ? "Actualiser ma position" : "Activer ma position"
                      }
                      onPress={() => void requestGPS()}
                      secondary
                    />
                  )}
                <Button
                  title={
                    location.enabled
                      ? "Mode test · aucun XP"
                      : busy
                        ? "Enregistrement…"
                        : found
                          ? "Consigné dans le carnet ✓"
                          : eligible
                            ? "Découvrir ce monument"
                            : "Rapprochez-vous pour découvrir"
                  }
                  disabled={
                    location.enabled ||
                    busy ||
                    found ||
                    !eligible ||
                    !ready ||
                    !!storageError
                  }
                  onPress={() => void claim()}
                />
              </Card>
              <Card>
                <Text style={s.heading}>Origine et contrôle</Text>
                <Text style={s.body}>
                  {monument.origin === "community"
                    ? "Contribution communautaire"
                    : monument.origin === "editorial"
                      ? "Catalogue éditorial Vestige"
                      : "Import de données externes"}
                  .{" "}
                  {verified
                    ? `Contrôle explicite : ${monument.verifiedBy}, le ${monument.verifiedAt}.`
                    : "Information non vérifiée individuellement."}
                </Text>
                <Text style={s.caption}>
                  Source disponible ≠ information vérifiée. Une découverte GPS
                  valide votre carnet, pas l’exactitude historique de la fiche.
                </Text>
                {!!monument.contributorId && (
                  <Text style={s.body}>
                    Identifiant du contributeur : {monument.contributorId}
                  </Text>
                )}
                {!!monument.provenanceHistory?.length && (
                  <>
                    <Text style={s.eyebrow}>Historique de provenance</Text>
                    {monument.provenanceHistory.map((entry, index) => (
                      <Button
                        key={index}
                        secondary
                        title={`${entry.origin === "import" ? "Import" : entry.origin === "community" ? "Communauté" : "Éditorial"}${entry.recordedAt ? ` · ${entry.recordedAt}` : ""} · référence ↗`}
                        onPress={() => open(entry.sourceUrl)}
                      />
                    ))}
                  </>
                )}
              </Card>
              <Text style={s.heading}>
                {monument.contentQuality === "minimal" || !monument.description
                  ? "Fiche à documenter"
                  : "L’histoire du lieu"}
              </Text>
              <Text style={[s.body, { color: colors.ink, lineHeight: 25 }]}>
                {monument.description ||
                  "Lieu identifié et géolocalisé. Son histoire détaillée reste à documenter ; consultez les références ci-dessous."}
              </Text>
              <Text style={s.caption}>
                La proximité GPS ne garantit pas l’accès au site. Respectez les
                horaires, les voies publiques et les zones fermées.
              </Text>
              {!!monument.aliases?.length && (
                <Text style={s.body}>
                  Cette fiche couvre : {monument.aliases.join(" · ")}
                </Text>
              )}
              <Text style={s.eyebrow}>Repères & localisation</Text>
              <Text selectable style={s.body}>
                {monument.latitude.toFixed(6)}, {monument.longitude.toFixed(6)}
              </Text>
              <Text style={s.caption}>
                {monument.coordinateSource
                  ? `Coordonnées : ${monument.coordinateSource.provider}. ${monument.coordinateSource.method ?? "Point de référence ; ce n’est pas une entrée garantie."}`
                  : "Point de référence du catalogue initial."}
              </Text>
              <Text style={s.caption}>
                Les dates mentionnées dans le texte proviennent de la source
                citée. Aucune chronologie supplémentaire n’est déduite
                automatiquement.
              </Text>
              {!!monument.timeline?.length && (
                <>
                  <Text style={s.eyebrow}>Repères chronologiques</Text>
                  {monument.timeline.map((event, index) => (
                    <View key={index}>
                      <Text style={s.heading}>{event.date}</Text>
                      <Text style={s.body}>{event.label}</Text>
                      <Button
                        secondary
                        title="Source du repère ↗"
                        onPress={() => open(event.source)}
                      />
                    </View>
                  ))}
                </>
              )}
              <Text style={s.eyebrow}>À proximité</Text>
              {monuments
                .filter(
                  (m) =>
                    isPublicPoi(m) &&
                    m.id !== monument.id &&
                    distance(m, monument) <= 1200,
                )
                .sort((a, b) => distance(a, monument) - distance(b, monument))
                .slice(0, 3)
                .map((m) => (
                  <Button
                    key={m.id}
                    title={`${m.name} · ${formatDistance(distance(m, monument))}`}
                    secondary
                    onPress={() => router.push(`/monument/${m.id}`)}
                  />
                ))}
            </>
          )}
          {tab === "sources" && (
            <>
              <Text style={s.eyebrow}>Sources & photographie</Text>
              {monument.sourceRefs?.length ? (
                monument.sourceRefs.map((ref) => (
                  <View key={ref.provider + ref.id} style={{ gap: 4 }}>
                    <Button
                      title={`${ref.provider} · ${ref.id} ↗`}
                      secondary
                      onPress={() => open(ref.url)}
                    />
                    <Text style={s.caption}>{ref.license}</Text>
                  </View>
                ))
              ) : (
                <Button
                  title="Source historique · Wikipédia ↗"
                  secondary
                  onPress={() => open(monument.source)}
                />
              )}
              {!!monument.attribution && (
                <Text style={s.caption}>{monument.attribution}</Text>
              )}
              {!!monument.photoPage && (
                <Button
                  title="Auteur, licence et photographie originale ↗"
                  secondary
                  onPress={() => open(monument.photoPage)}
                />
              )}
              <Text style={s.caption}>
                Extraits Wikipédia : CC BY-SA 4.0, liens ci-dessus. Données
                Wikidata : CC0. Les références POP ne constituent pas une copie
                de ses textes ou photos. Sources consultées le 9 novembre 2026.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
      <DiscoveryNotice receipt={receipt} close={() => setReceipt(null)} />
    </View>
  );
}
