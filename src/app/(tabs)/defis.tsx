import React from "react";
import { Text, View } from "react-native";
import { monuments } from "../../data/monuments";
import { achievements } from "../../lib/achievements";
import { useGame } from "../../lib/store";
import { Page, Card, Badge, ProgressBar, Icon, s } from "../../components/ui";
import { colors } from "../../theme";
export default function Defis() {
  const { journal } = useGame();
  return (
    <Page
      eyebrow="Chaque pas fait progresser"
      title="À vous d’écrire l’histoire"
    >
      <Text style={s.body}>
        Des succès permanents, validés par vos découvertes réelles. Les XP sont
        gagnés sur les monuments.
      </Text>
      {achievements(journal, monuments).map((c) => (
        <Card key={c.id}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Icon
              name={c.value >= c.goal ? "ribbon" : "ribbon-outline"}
              color={c.value >= c.goal ? colors.turquoise : colors.violet}
              size={30}
            />
            <Badge tone={c.value >= c.goal ? "turquoise" : "violet"}>
              {c.value >= c.goal ? "Succès débloqué" : `${c.value} / ${c.goal}`}
            </Badge>
          </View>
          <Text style={s.heading}>{c.title}</Text>
          <Text style={s.body}>{c.description}</Text>
          <ProgressBar
            value={c.value}
            max={c.goal}
            label={c.title}
            tone={c.value >= c.goal ? "turquoise" : "violet"}
          />
        </Card>
      ))}
      <Card>
        <Badge tone="blue">À venir</Badge>
        <Text style={s.heading}>Quêtes quotidiennes</Text>
        <Text style={s.body}>
          Les défis renouvelés chaque jour seront disponibles dans une prochaine
          version.
        </Text>
      </Card>
    </Page>
  );
}
