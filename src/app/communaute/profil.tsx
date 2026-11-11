import React, { useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Page, Card, Button, Badge, Icon, s } from "../../components/ui";
import {
  Field,
  ErrorNotice,
  LocalNotice,
  useSocialAction,
} from "../../components/community/Common";
import { useCommunity } from "../../lib/community/CommunityProvider";
import type { PublicProfile } from "../../lib/community/model";
export default function CommunityProfile() {
  const c = useCommunity(),
    { author } = useLocalSearchParams<{ author?: string }>();
  if (!c.ready)
    return (
      <Page eyebrow="Communauté" title="Chargement…">
        <ErrorNotice message={c.error} />
      </Page>
    );
  const imported = author
    ? c.state.items.find((i) => i.id === author && !i.owned)
    : undefined;
  if (author && !imported)
    return (
      <Page eyebrow="Communauté" title="Profil indisponible">
        <Text style={s.body}>Cette copie a été retirée de l’appareil.</Text>
      </Page>
    );
  return (
    <Profile
      key={author ?? "me"}
      value={imported?.author ?? c.state.profile}
      itemId={imported?.id}
    />
  );
}
function Profile({ value, itemId }: { value: PublicProfile; itemId?: string }) {
  const c = useSocialAction(),
    [alias, setAlias] = useState(value.alias),
    [bio, setBio] = useState(value.bio),
    [city, setCity] = useState(value.city),
    [avatar, setAvatar] = useState(value.avatar);
  // Imported profiles are snapshots, not authenticated remote accounts; do not merge aliases.
  const items = c.state.items.filter(
    (i) =>
      i.visibility === "local_published" &&
      (itemId ? i.id === itemId : i.owned),
  );
  return (
    <Page
      eyebrow="Les passeurs de mémoire"
      title={itemId ? value.alias : "Mon profil communautaire"}
    >
      <LocalNotice />
      <ErrorNotice message={c.error} />
      <Card>
        <Icon
          name={
            avatar === "book"
              ? "book-outline"
              : avatar === "temple"
                ? "business-outline"
                : "compass-outline"
          }
          size={64}
          color="#E3C88E"
        />
        <Badge>
          {itemId
            ? "Profil importé · identité non authentifiée"
            : "Aperçu du profil partageable"}
        </Badge>
        <Text style={s.heading}>{alias}</Text>
        <Text style={s.body}>{bio}</Text>
        {!!city && (
          <Text style={s.caption}>{city} · ville déclarée facultative</Text>
        )}
        <Text style={s.caption}>
          Badges publics : aucun attribué. Le carnet, les XP et les déplacements
          restent privés.
        </Text>
      </Card>
      {!itemId && (
        <>
          <Field
            label="Pseudo public (sans nom réel obligatoire)"
            value={alias}
            change={setAlias}
            max={32}
          />
          <Field
            label="Bio courte · ne partagez aucune donnée privée"
            value={bio}
            change={setBio}
            max={280}
            multiline
          />
          <Field
            label="Ville affichée (facultative)"
            value={city}
            change={setCity}
            max={60}
          />
          <View style={{ gap: 6 }}>
            {(["compass", "book", "temple"] as const).map((v) => (
              <Button
                key={v}
                secondary
                title={`${avatar === v ? "✓ " : ""}${v === "compass" ? "Boussole" : v === "book" ? "Livre" : "Temple"}`}
                onPress={() => setAvatar(v)}
              />
            ))}
          </View>
          <Button
            title="Enregistrer mon profil local"
            disabled={c.busy}
            onPress={() =>
              void c.run(
                () => c.store.profile({ alias, bio, city, avatar }),
                () => router.back(),
              )
            }
          />
          <Text style={s.caption}>
            Ce profil n’est pas un compte Internet. Une copie de ses champs sera
            partagée avec vos créations, sur votre action. Ne renseignez ni
            adresse, ni école, ni coordonnées personnelles.
          </Text>
        </>
      )}
      <Text style={s.heading}>
        {itemId
          ? "Création associée à cette copie"
          : "Mes créations dans le fil local"}
      </Text>
      {!items.length && (
        <Text style={s.body}>Aucune création ajoutée au fil.</Text>
      )}
      {items.map((i) => (
        <Button
          key={i.id}
          secondary
          title={`${i.kind === "route" ? "Parcours" : "Découverte"} · ${i.title}`}
          onPress={() => router.push(`/communaute/${i.id}`)}
        />
      ))}
    </Page>
  );
}
