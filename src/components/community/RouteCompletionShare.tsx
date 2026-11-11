import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Button, s } from "../ui";
import { useLive } from "../../lib/live/LiveProvider";
import { useCommunity } from "../../lib/community/CommunityProvider";
import { shareCreation } from "./Common";
export function RouteCompletionShare({ bottom }: { bottom: number }) {
  const live = useLive(),
    community = useCommunity(),
    [dismissed, setDismissed] = useState("");
  const session = live.session,
    key = session ? `${session.tourId}:${session.startedAt}` : "";
  if (
    !session?.endedAt ||
    session.index < live.tour.stops.length ||
    dismissed === key
  )
    return null;
  const item = community.state.items.find((i) => i.id === session.tourId);
  return (
    <View
      style={{
        position: "absolute",
        bottom,
        left: 16,
        right: 16,
        backgroundColor: "#07152C",
        borderColor: "#C5A05B",
        borderWidth: 1,
        borderRadius: 18,
        padding: 14,
        gap: 8,
      }}
    >
      <Text style={s.heading}>
        {live.preview ? "Démonstration terminée" : "Parcours terminé"}
      </Text>
      <Text style={s.caption}>
        {live.tour.title} ·{" "}
        {live.preview
          ? "sans progression réelle"
          : "les étapes ignorées ne valident pas de découverte"}
      </Text>
      <Button
        title={
          item
            ? "Partager ce parcours"
            : "Partager ma découverte de la dernière étape"
        }
        onPress={() =>
          item
            ? void shareCreation(item)
            : router.push({
                pathname: "/communaute/creer",
                params: {
                  kind: "discovery",
                  poi: live.tour.stops[live.tour.stops.length - 1].poiId,
                },
              })
        }
      />
      <Button secondary title="Fermer" onPress={() => setDismissed(key)} />
    </View>
  );
}
