import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Page, Card, Badge, Button, s } from "../../components/ui";
import {
  LocalNotice,
  ErrorNotice,
  useSocialAction,
} from "../../components/community/Common";
import { monuments } from "../../data/monuments";
export default function CommunityFeed() {
  const c = useSocialAction(),
    [city, setCity] = useState("Lyon"),
    [kind, setKind] = useState("all"),
    [category, setCategory] = useState("Tous les thèmes"),
    [saved, setSaved] = useState(false),
    [limit, setLimit] = useState(20);
  const items = c.state.items
    .filter(
      (i) =>
        i.visibility === "local_published" &&
        !c.state.hidden.includes(i.id) &&
        (kind === "all" || i.kind === kind) &&
        (category === "Tous les thèmes" || i.category === category) &&
        (!saved || c.state.saved.includes(i.id)) &&
        (city === "Toutes" ||
          i.poiIds.some(
            (id) => monuments.find((p) => p.id === id)?.city === city,
          )),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <Page eyebrow="Les passeurs de mémoire" title="Communauté">
      <Button
        title="Communauté en ligne"
        onPress={() => router.push("/communaute/en-ligne")}
      />
      <LocalNotice />
      <ErrorNotice message={c.error} />
      <Button
        title="Créer mon parcours"
        onPress={() =>
          router.push({
            pathname: "/communaute/creer",
            params: { kind: "route" },
          })
        }
      />
      <Button
        secondary
        title="Partager une découverte"
        onPress={() =>
          router.push({
            pathname: "/communaute/creer",
            params: { kind: "discovery" },
          })
        }
      />
      <View style={{ gap: 8 }}>
        <Button
          secondary
          title="Mon profil communautaire"
          onPress={() => router.push("/communaute/profil")}
        />
        <Button
          secondary
          title="Importer une création partagée"
          onPress={() => router.push("/communaute/importer")}
        />
        <Button
          secondary
          title="Brouillons et signalements locaux"
          onPress={() => router.push("/communaute/moderation")}
        />
      </View>
      <Text style={s.heading}>Le fil de votre appareil</Text>
      <View style={{ gap: 6 }}>
        {[
          "Tous les thèmes",
          ...new Set(
            c.state.items
              .filter((i) => i.visibility === "local_published" && i.category)
              .map((i) => i.category),
          ),
        ].map((v) => (
          <Button
            key={v}
            secondary
            title={`${category === v ? "✓ " : ""}${v}`}
            onPress={() => setCategory(v)}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {["Lyon", "Toutes"].map((v) => (
          <Button
            key={v}
            secondary
            title={`${city === v ? "✓ " : ""}${v}`}
            onPress={() => setCity(v)}
          />
        ))}
      </View>
      <View style={{ gap: 6 }}>
        {[
          ["all", "Tout"],
          ["route", "Parcours"],
          ["discovery", "Découvertes"],
        ].map(([v, label]) => (
          <Button
            key={v}
            secondary
            title={`${kind === v ? "✓ " : ""}${label}`}
            onPress={() => setKind(v)}
          />
        ))}
        <Button
          secondary
          title={
            saved ? "✓ Enregistrés seulement" : "Mes créations enregistrées"
          }
          onPress={() => setSaved((v) => !v)}
        />
      </View>
      {!c.ready && <Text style={s.body}>Chargement…</Text>}
      {c.ready && !items.length && (
        <Card>
          <Text style={s.heading}>Le premier récit sera le vôtre</Text>
          <Text style={s.body}>
            Créez une découverte ou importez le code envoyé par un proche. Aucun
            faux utilisateur ni faux témoignage ne remplit ce fil.
          </Text>
        </Card>
      )}
      {items.slice(0, limit).map((i) => (
        <Card key={i.id}>
          <Badge tone="coral">
            Communauté · non vérifié · {i.owned ? "créé ici" : "copie importée"}
          </Badge>
          <Text style={s.heading}>{i.title}</Text>
          <Text style={s.caption}>
            {i.author.alias} ·{" "}
            {i.kind === "route" ? `${i.poiIds.length} étapes` : "Découverte"} ·{" "}
            {i.period || "Époque non renseignée"}
          </Text>
          <Text style={s.body} numberOfLines={3}>
            {i.text}
          </Text>
          <Button
            title="Ouvrir"
            onPress={() => router.push(`/communaute/${i.id}`)}
          />
        </Card>
      ))}
      {items.length > limit && (
        <Button
          secondary
          title="Voir la suite"
          onPress={() => setLimit((n) => n + 20)}
        />
      )}
    </Page>
  );
}
