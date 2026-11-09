import React, { useState } from "react";
import { Text, View } from "react-native";
import { trails, monuments } from "../../data/monuments";
import { useGame } from "../../lib/store";
import { distance, formatDistance } from "../../lib/game";
import { Page, Button, MonumentRow, colors, s } from "../../components/ui";
export default function Parcours() {
  const { journal } = useGame();
  const [active, setActive] = useState<string | null>(null);
  return (
    <Page eyebrow="À pied, à travers les siècles" title="Les chemins du passé">
      <Text style={s.body}>
        Deux sélections de lieux à explorer à votre rythme. L’ordre est suggéré
        ; les distances sont à vol d’oiseau, sans guidage routier.
      </Text>
      {trails.map((trail) => {
        const stops = trail.ids.map((id) =>
          monuments.find((m) => m.id === id)!,
        );
        const count = stops.filter((m) => journal[m.id]).length;
        const length = stops
          .slice(1)
          .reduce((sum, m, i) => sum + distance(stops[i], m), 0);
        return (
          <View key={trail.id} style={s.card}>
            <Text style={s.eyebrow}>
              {trail.city} · {stops.length} étapes · {formatDistance(length)}
            </Text>
            <Text style={s.heading}>{trail.title}</Text>
            <Text style={s.body}>
              {trail.subtitle} · {count}/{stops.length} découverts
            </Text>
            <View style={s.track}>
              <View
                style={{
                  height: 5,
                  width: `${(count / stops.length) * 100}%`,
                  backgroundColor: colors.gold,
                }}
              />
            </View>
            <Button
              secondary
              title={
                active === trail.id ? "Refermer les étapes" : "Voir les étapes"
              }
              onPress={() => setActive(active === trail.id ? null : trail.id)}
            />
            {active === trail.id &&
              stops.map((m) => (
                <MonumentRow
                  key={m.id}
                  monument={m}
                  discovered={!!journal[m.id]}
                />
              ))}
          </View>
        );
      })}
    </Page>
  );
}
