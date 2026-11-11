import React from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { vienneAntique } from "../../data/live/vienneAntique";
import { monuments } from "../../data/monuments";
import { distance, formatDistance } from "../../lib/game";
import { useLive } from "../../lib/live/LiveProvider";
import { MonumentPhoto } from "../MonumentPhoto";
import { Badge, Button, ProgressBar, s } from "../ui";
export function TourCard() {
  const live = useLive(),
    stops = vienneAntique.stops;
  const length = stops
    .slice(1)
    .reduce(
      (sum, stop, i) => sum + distance(stops[i].approach, stop.approach),
      0,
    );
  const resume = !!live.session && live.session.endedAt === null;
  return (
    <View style={[s.card, { gap: 12 }]}>
      <MonumentPhoto
        monument={monuments.find((m) => m.id === stops[0].poiId)!}
        style={{ height: 150, width: "100%", borderRadius: 18 }}
      />
      <Badge tone="blue">Vestige Live · pilote V1</Badge>
      <Text style={s.heading}>{vienneAntique.title}</Text>
      <Text style={s.body}>{vienneAntique.subtitle}</Text>
      <Text style={s.body}>
        3 étapes · {formatDistance(length)} de distance indicative · ≈{" "}
        {Math.ceil(length / 60)} min de marche indicative, hors arrêts et
        détours.
      </Text>
      <Text style={s.caption}>
        Distance à vol d’oiseau entre repères, pas un itinéraire piéton. Le
        théâtre a des horaires et une entrée généralement payante.
      </Text>
      <Text style={s.body}>
        Audio en préparation · 3 transcriptions provisoires sourcées, à relire.
        Aucun déclenchement sonore de ces brouillons.
      </Text>
      {live.session && (
        <>
          <ProgressBar
            value={Object.keys(live.session.outcomes).length}
            max={3}
            label="Étapes traitées dans la visite"
          />
          <Text style={s.caption}>
            {Object.keys(live.session.outcomes).length}/3 étapes traitées,
            indépendamment des découvertes et des XP.
          </Text>
        </>
      )}
      {stops.map((stop, i) => (
        <Text key={stop.poiId} style={s.caption}>
          {i + 1}. {monuments.find((m) => m.id === stop.poiId)?.name}
        </Text>
      ))}
      {live.storageError && <Text style={s.body}>{live.storageError}</Text>}
      <Button
        title={resume ? "Reprendre la visite" : "Commencer"}
        disabled={!live.ready || !!live.storageError}
        onPress={() => {
          if (!resume) live.begin();
          router.push("/visite-vienne");
        }}
      />
    </View>
  );
}
