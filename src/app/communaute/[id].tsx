import React, { useState } from "react";
import { Alert, Image, Linking, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Page, Card, Badge, Button, s } from "../../components/ui";
import {
  LocalNotice,
  Field,
  ErrorNotice,
  shareCreation,
  useSocialAction,
} from "../../components/community/Common";
import { RoutePreview } from "../../components/community/RoutePreview";
import { monuments } from "../../data/monuments";
import { useLive } from "../../lib/live/LiveProvider";
import { removeDraftPhoto } from "../../lib/contributions/photos";
export default function CommunityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    c = useSocialAction(),
    live = useLive(),
    [reason, setReason] = useState("");
  const item = c.state.items.find((i) => i.id === id);
  if (!item)
    return (
      <Page eyebrow="Communauté" title="Création indisponible">
        <ErrorNotice message={c.error} />
        <Text style={s.body}>
          {c.ready
            ? "Cette création n’est pas enregistrée sur cet appareil. Importez le code partagé par son auteur."
            : "Chargement…"}
        </Text>
      </Page>
    );
  return (
    <Page
      eyebrow={
        item.kind === "route" ? "Parcours communautaire" : "Découverte partagée"
      }
      title={item.title}
    >
      <LocalNotice />
      <Badge tone="coral">
        {item.visibility === "draft"
          ? "Brouillon privé"
          : "Proposé par la communauté · non vérifié"}
      </Badge>
      <ErrorNotice message={c.error} />
      <Text style={s.caption}>
        {item.author.alias} ·{" "}
        {new Date(item.updatedAt).toLocaleDateString("fr-FR")} (
        {item.owned ? "date locale" : "date d’import"})
      </Text>
      <Button
        secondary
        title={`Voir le profil de ${item.author.alias}`}
        onPress={() =>
          router.push({
            pathname: "/communaute/profil",
            params: item.owned ? {} : { author: item.id },
          })
        }
      />
      {item.photos.map((uri) => (
        <Image
          key={uri}
          source={{ uri }}
          style={{ height: 220, borderRadius: 16 }}
          accessibilityLabel="Photo locale de l’auteur"
        />
      ))}
      <Text style={s.body}>{item.text || "Aucun récit ajouté."}</Text>
      <Text style={s.caption}>
        {item.period || "Époque non renseignée"} ·{" "}
        {item.category || "Thème libre"} · {item.audience}
      </Text>
      {item.sources.map((url) => (
        <Button
          key={url}
          secondary
          title={`Source proposée ↗ ${url}`}
          onPress={() =>
            void Linking.openURL(url).catch(() =>
              Alert.alert("Source indisponible"),
            )
          }
        />
      ))}
      <Text style={s.caption}>
        Les sources proposées ne constituent pas une vérification. Ce texte ne
        peut pas déclencher automatiquement George.
      </Text>
      <RoutePreview ids={item.poiIds} />
      {item.poiIds.map((poiId, index) => {
        const p = monuments.find((m) => m.id === poiId);
        return p ? (
          <Button
            key={poiId}
            secondary
            title={`${index + 1}. ${p.name}`}
            onPress={() => router.push(`/monument/${p.id}`)}
          />
        ) : null;
      })}
      {item.kind === "route" && item.visibility === "local_published" && (
        <Button
          title="Lancer ce parcours dans Explorer"
          disabled={
            !live.ready ||
            !!live.storageError ||
            c.busy ||
            c.state.hidden.includes(item.id)
          }
          onPress={() => {
            live.begin(item.id);
            router.navigate({
              pathname: "/(tabs)",
              params: { guide: "start", command: String(Date.now()) },
            });
          }}
        />
      )}
      {item.visibility === "local_published" && (
        <>
          <Button
            secondary
            title={
              c.state.saved.includes(item.id)
                ? "Retirer des enregistrements"
                : "Enregistrer cette création"
            }
            disabled={c.busy}
            onPress={() => void c.run(() => c.store.toggleSaved(item.id))}
          />
          <Button
            title="Partager une copie"
            onPress={() => void shareCreation(item)}
          />
          <Text style={s.caption}>
            Le code transporte le texte, le pseudo et les identifiants des
            monuments publics. Il ne contient ni photos privées, ni GPS du
            joueur, ni carnet. Le lien Expo Go exige le même serveur actif ; le
            code reste importable indépendamment.
          </Text>
        </>
      )}
      {item.owned && (
        <Button
          secondary
          title="Modifier ma création"
          onPress={() =>
            router.push({
              pathname: "/communaute/creer",
              params: { id: item.id },
            })
          }
        />
      )}
      <Card>
        <Text style={s.heading}>Signaler et masquer sur cet appareil</Text>
        <Field
          label="Motif du signalement"
          value={reason}
          change={setReason}
          max={300}
          multiline
        />
        <Button
          secondary
          title="Conserver le signalement local et masquer"
          disabled={c.busy || !reason.trim()}
          onPress={() =>
            void c.run(
              () => c.store.report(item.id, reason, Date.now()),
              () => router.replace("/communaute"),
            )
          }
        />
        <Text style={s.caption}>
          Aucun modérateur distant ne reçoit ce signalement. La file est
          consultable dans Brouillons et signalements locaux.
        </Text>
      </Card>
      <Button
        secondary
        title={
          item.owned
            ? "Supprimer ma création locale"
            : "Supprimer cette copie importée"
        }
        disabled={c.busy}
        onPress={() =>
          Alert.alert(
            "Supprimer cette création ?",
            "Le guidage de ce parcours sera arrêté. Votre carnet et vos XP sont conservés.",
            [
              { text: "Annuler", style: "cancel" },
              {
                text: "Supprimer",
                style: "destructive",
                onPress: () =>
                  void c.run(
                    () => c.store.remove(item.id),
                    () => {
                      item.photos.forEach(removeDraftPhoto);
                      router.replace("/communaute");
                    },
                  ),
              },
            ],
          )
        }
      />
    </Page>
  );
}
