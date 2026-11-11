import type { LiveTour } from "../../lib/live/types";

import { useGame } from "../../lib/store";
import React from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { vienneAntique, liveStories } from "../../data/live/vienneAntique";
import { monuments } from "../../data/monuments";
import { useLive } from "../../lib/live/LiveProvider";
import { MonumentPhoto } from "../MonumentPhoto";
import { Badge, Button, ProgressBar, s } from "../ui";
export function TourCard({ tour = vienneAntique }: { tour?: LiveTour }) {
  const live = useLive(),
    stops = tour.stops;
  const saved =
    live.session?.tourId === tour.id ? live.session : live.savedVisit(tour.id);
  const resume = !!saved && saved.endedAt === null;
  const { journal } = useGame();
  const discoveries = stops.filter((stop) => journal[stop.poiId]).length;
  const narrationCount = stops.filter((stop) =>
    liveStories.some((story) => story.id === stop.storyId),
  ).length;
  function start() {
    live.begin(tour.id);
    router.navigate({
      pathname: "/(tabs)",
      params: { guide: "start", command: String(Date.now()) },
    });
  }
  return (
    <View style={[s.card, { gap: 12 }]}>
      <MonumentPhoto
        monument={monuments.find((m) => m.id === stops[0].poiId)!}
        style={{ height: 150, width: "100%", borderRadius: 18 }}
      />
      <Badge tone="blue">Vestige Live · pilote V1</Badge>
      <Text style={s.heading}>{tour.title}</Text>
      <Text style={s.body}>{tour.subtitle}</Text>
      <Text style={s.body}>
        {stops.length} étapes · itinéraire piéton calculé depuis votre GPS après
        activation.
      </Text>
      <Text style={s.caption}>
        Distances, durées et changements de direction sont fournis par le moteur
        de routage. Vérifiez les accès et horaires dans les fiches des étapes.
      </Text>
      <Text style={s.body}>
        {narrationCount
          ? `${narrationCount} narration(s) documentée(s), audio en préparation. Les brouillons ne sont pas lus automatiquement.`
          : "Fiches historiques disponibles ; aucune narration approuvée pour ce parcours."}
      </Text>
      <Text style={s.caption}>
        {discoveries}/{stops.length} monuments découverts dans le carnet · les
        XP restent liés aux découvertes GPS.
      </Text>
      {saved && (
        <>
          <ProgressBar
            value={Object.keys(saved.outcomes).length}
            max={stops.length}
            label="Étapes traitées dans la visite"
          />
          <Text style={s.caption}>
            {Object.keys(saved.outcomes).length}/{stops.length} étapes traitées,
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
        title={resume ? "Reprendre dans Explorer" : "Commencer"}
        disabled={!live.ready || !!live.storageError}
        onPress={start}
      />
      <Text style={s.caption}>
        Le parcours et son guidage s’ouvrent sur la grande carte Explorer. Le
        calcul transmet départ et destination à Valhalla/FOSSGIS après
        activation.
      </Text>
    </View>
  );
}
