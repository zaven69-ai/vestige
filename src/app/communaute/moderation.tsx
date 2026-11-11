import React from "react";
import { Alert, Text } from "react-native";
import { router } from "expo-router";
import { Page, Card, Badge, Button, s } from "../../components/ui";
import {
  ErrorNotice,
  LocalNotice,
  useSocialAction,
} from "../../components/community/Common";
import { removeDraftPhoto } from "../../lib/contributions/photos";
export default function LocalModeration() {
  const c = useSocialAction();
  return (
    <Page
      eyebrow="Sur cet appareil seulement"
      title="Brouillons et signalements"
    >
      <LocalNotice />
      <ErrorNotice message={c.error} />
      <Text style={s.heading}>Mes brouillons</Text>
      {c.state.items
        .filter((i) => i.visibility === "draft")
        .map((i) => (
          <Button
            key={i.id}
            secondary
            title={i.title}
            onPress={() =>
              router.push({
                pathname: "/communaute/creer",
                params: { id: i.id },
              })
            }
          />
        ))}
      <Text style={s.heading}>
        File de signalements locale ({c.state.reports.length})
      </Text>
      <Text style={s.caption}>
        Ces signalements ne sont pas transmis. Ils seront à examiner par une
        équipe de modération après mise en place du backend.
      </Text>
      {c.state.reports.map((r) => (
        <Card key={r.id}>
          <Badge tone="coral">Local · non transmis</Badge>
          <Text style={s.heading}>
            {c.state.items.find((i) => i.id === r.itemId)?.title ??
              "Création retirée"}
          </Text>
          <Text style={s.body}>{r.reason}</Text>
          <Text style={s.caption}>
            {new Date(r.createdAt).toLocaleString("fr-FR")}
          </Text>
          {c.state.items.some((i) => i.id === r.itemId) && (
            <Button
              secondary
              title="Consulter la création masquée"
              onPress={() => router.push(`/communaute/${r.itemId}`)}
            />
          )}
        </Card>
      ))}
      <Card>
        <Text style={s.heading}>Effacer mon espace communautaire</Text>
        <Text style={s.body}>
          Supprime le profil local, les créations et leurs photos, les imports,
          enregistrements et signalements. Le carnet, les XP, les contributions
          précédentes et George sont conservés. Les copies déjà envoyées à
          d’autres personnes ne peuvent pas être rappelées.
        </Text>
        <Button
          secondary
          title="Effacer ces données locales"
          disabled={c.busy || !c.ready}
          onPress={() =>
            Alert.alert(
              "Effacer l’espace communautaire ?",
              "Cette action ne supprime pas votre progression de jeu.",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Effacer",
                  style: "destructive",
                  onPress: () => {
                    const photos = c.state.items.flatMap((i) => i.photos);
                    void c.run(
                      () => c.store.clear(),
                      () => {
                        photos.forEach(removeDraftPhoto);
                        router.replace("/communaute");
                      },
                      true,
                    );
                  },
                },
              ],
            )
          }
        />
      </Card>
    </Page>
  );
}
