import { MonumentPhoto } from "../../components/MonumentPhoto";
import React, { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { trails, monuments } from "../../data/monuments";
import { useGame } from "../../lib/store";
import { distance, formatDistance } from "../../lib/game";
import {
  Page,
  Button,
  MonumentRow,
  Badge,
  ProgressBar,
  s,
} from "../../components/ui";
import { colors, theme } from "../../theme";
export default function Parcours() {
  const { journal } = useGame();
  const [active, setActive] = useState<string | null>(null);
  return (
    <Page
      eyebrow="Des histoires à parcourir"
      title="Choisissez votre prochaine aventure"
    >
      <Text style={s.body}>
        Deux circuits à explorer à votre rythme. Les étapes sont suggérées ; le
        guidage routier reste à venir.
      </Text>
      {trails.map((trail) => {
        const stops = trail.ids.map((id) =>
          monuments.find((m) => m.id === id)!,
        );
        const count = stops.filter((m) => journal[m.id]).length;
        const length = stops
          .slice(1)
          .reduce((sum, m, i) => sum + distance(stops[i], m), 0);
        const totalXP = stops.reduce((sum, m) => sum + m.xp, 0);
        const remainingXP = stops.reduce(
          (sum, m) => sum + (journal[m.id] ? 0 : m.xp),
          0,
        );
        return (
          <View key={trail.id} style={styles.card}>
            <MonumentPhoto monument={stops[0]} style={styles.cover} />
            <View style={styles.content}>
              <View style={styles.metadata}>
                <Badge tone="blue">{trail.city}</Badge>
                <Badge>{totalXP} XP au total</Badge>
              </View>
              <Text style={s.heading}>{trail.title}</Text>
              <Text style={s.body}>{trail.subtitle}</Text>
              <View style={styles.metadata}>
                <Text style={s.caption}>{stops.length} étapes</Text>
                <Text style={s.caption}>{formatDistance(length)}</Text>
                <Text style={s.caption}>
                  ≈ {Math.ceil(length / 60)} min de marche*
                </Text>
              </View>
              <ProgressBar
                value={count}
                max={stops.length}
                label={`Progression du parcours ${trail.title}`}
                tone="blue"
              />
              <Text style={s.caption}>
                {count}/{stops.length} découverts · {remainingXP} XP encore à
                trouver
              </Text>
              <Button
                title={
                  active === trail.id
                    ? "Refermer les étapes"
                    : "Explorer ce parcours"
                }
                onPress={() => setActive(active === trail.id ? null : trail.id)}
                secondary={count === stops.length}
              />
              {active === trail.id &&
                stops.map((m, i) => (
                  <View key={m.id} style={{ gap: theme.space.xxs }}>
                    <Text style={s.eyebrow}>Étape {i + 1}</Text>
                    <MonumentRow monument={m} discovered={!!journal[m.id]} />
                  </View>
                ))}
            </View>
          </View>
        );
      })}
      <Text style={s.caption}>
        * Distance à vol d’oiseau entre les étapes. Durée indicative calculée à
        3,6 km/h, hors visites et détours ; ce n’est pas un itinéraire piéton
        calculé. Les XP sont ceux des monuments, sans bonus de parcours.
      </Text>
    </Page>
  );
}
const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cover: { width: "100%", height: 146 },
  content: { padding: theme.space.lg, gap: theme.space.sm },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.space.xs,
    alignItems: "center",
  },
});
