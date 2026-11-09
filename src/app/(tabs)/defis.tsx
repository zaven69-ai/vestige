import React from "react";
import { Text, View } from "react-native";
import { monuments } from "../../data/monuments";
import { useGame } from "../../lib/store";
import { Page, Icon, colors, s } from "../../components/ui";
export default function Defis() {
  const { journal } = useGame();
  const found = monuments.filter((m) => journal[m.id]);
  const challenges = [
    {
      title: "Le premier pas",
      description: "Découvrez votre premier monument.",
      value: Math.min(found.length, 1),
      goal: 1,
    },
    {
      title: "Mémoire de Vienna",
      description: "Retrouvez les quatre lieux de Vienne.",
      value: found.filter((m) => m.city === "Vienne").length,
      goal: 4,
    },
    {
      title: "Lugdunum vous appelle",
      description: "Retrouvez les quatre lieux de Lyon.",
      value: found.filter((m) => m.city === "Lyon").length,
      goal: 4,
    },
    {
      title: "Les gardiens de Rome",
      description: "Découvrez les quatre monuments antiques.",
      value: found.filter((m) => m.era === "Antiquité").length,
      goal: 4,
    },
  ];
  return (
    <Page eyebrow="Chaque détour compte" title="L’appel de l’histoire">
      <Text style={s.body}>
        Des objectifs permanents validés automatiquement par vos découvertes.
        Les XP sont gagnés sur les monuments.
      </Text>
      {challenges.map((c) => (
        <View key={c.title} style={s.card}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Icon
              name={c.value >= c.goal ? "ribbon" : "ribbon-outline"}
              size={30}
            />
            <Text style={s.eyebrow}>
              {c.value >= c.goal ? "Accompli" : `${c.value} / ${c.goal}`}
            </Text>
          </View>
          <Text style={s.heading}>{c.title}</Text>
          <Text style={s.body}>{c.description}</Text>
          <View style={s.track}>
            <View
              style={{
                height: 5,
                width: `${(c.value / c.goal) * 100}%`,
                backgroundColor: colors.gold,
              }}
            />
          </View>
        </View>
      ))}
    </Page>
  );
}
