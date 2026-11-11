import React, { useEffect, useRef, useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Page, Card, Button, s } from "../../components/ui";
import {
  LocalNotice,
  Field,
  ErrorNotice,
  useSocialAction,
} from "../../components/community/Common";
import { useCommunity } from "../../lib/community/CommunityProvider";
import type { CommunityItem } from "../../lib/community/model";
import { monuments } from "../../data/monuments";
import {
  pickDraftPhoto,
  removeDraftPhoto,
} from "../../lib/contributions/photos";
import { RoutePreview } from "../../components/community/RoutePreview";
const newId = () =>
  `social-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
export default function CreateScreen() {
  const params = useLocalSearchParams<{
      id?: string;
      kind?: string;
      poi?: string;
    }>(),
    c = useCommunity();
  if (!c.ready)
    return (
      <Page eyebrow="Communauté" title="Chargement…">
        <ErrorNotice message={c.error} />
      </Page>
    );
  const prior = c.state.items.find((i) => i.id === params.id);
  if (params.id && (!prior || !prior.owned))
    return (
      <Page eyebrow="Communauté" title="Création indisponible">
        <Text style={s.body}>
          Seules vos propres créations peuvent être modifiées.
        </Text>
      </Page>
    );
  return (
    <Editor
      key={prior?.id ?? params.poi ?? params.kind ?? "new"}
      prior={prior}
      kind={params.kind}
      poi={params.poi}
    />
  );
}
function Editor({
  prior,
  kind,
  poi,
}: {
  prior?: CommunityItem;
  kind?: string;
  poi?: string;
}) {
  const c = useSocialAction();
  const [id] = useState(() => prior?.id ?? newId()),
    [title, setTitle] = useState(prior?.title ?? ""),
    [body, setBody] = useState(prior?.text ?? ""),
    [period, setPeriod] = useState(prior?.period ?? ""),
    [category, setCategory] = useState(prior?.category ?? ""),
    [audience, setAudience] = useState(prior?.audience ?? "Tous publics"),
    [sources, setSources] = useState(prior?.sources.join("\n") ?? ""),
    [selected, setSelected] = useState<string[]>(
      prior?.poiIds ??
        (poi && monuments.some((m) => m.id === poi) ? [poi] : []),
    ),
    [search, setSearch] = useState(""),
    [city, setCity] = useState("Lyon"),
    [photos, setPhotos] = useState(prior?.photos ?? []),
    [consent, setConsent] = useState(prior?.photoConsent ?? false),
    [picking, setPicking] = useState(false);
  const pendingPhotos = useRef<string[]>([]);
  useEffect(
    () => () => {
      pendingPhotos.current.forEach(removeDraftPhoto);
    },
    [],
  );
  const itemKind =
      prior?.kind ?? (kind === "discovery" ? "discovery" : "route"),
    locked = prior?.kind === "route" && prior.visibility === "local_published";
  const matches = monuments
    .filter(
      (m) =>
        (city === "Toutes" || m.city === city) &&
        `${m.name} ${m.city}`
          .toLocaleLowerCase("fr")
          .includes(search.toLocaleLowerCase("fr")),
    )
    .slice(0, search.trim() ? 25 : 8);
  function save(visibility: CommunityItem["visibility"]) {
    const now = Date.now();
    const item: CommunityItem = {
      id,
      kind: itemKind,
      title: title.trim(),
      text: body.trim(),
      period: period.trim(),
      category: category.trim(),
      audience: audience.trim(),
      poiIds: selected,
      sources: sources
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean),
      photos,
      photoConsent: consent,
      author: c.state.profile,
      owned: true,
      visibility,
      contentStatus: "community_published_unverified",
      createdAt: prior?.createdAt ?? now,
      updatedAt: now,
    };
    void c.run(
      () => c.store.save(item),
      () => {
        pendingPhotos.current = [];
        prior?.photos
          .filter((uri) => !photos.includes(uri))
          .forEach(removeDraftPhoto);
        router.replace(`/communaute/${id}`);
      },
    );
  }
  return (
    <Page
      eyebrow="Votre carnet collectif"
      title={
        itemKind === "route"
          ? "Composer un parcours"
          : "Raconter une découverte"
      }
    >
      <LocalNotice />
      <ErrorNotice message={c.error} />
      <Field label="Titre" value={title} change={setTitle} />
      <Field
        label="Description ou anecdote (non vérifiée)"
        value={body}
        change={setBody}
        max={2000}
        multiline
      />
      <Field label="Époque" value={period} change={setPeriod} max={80} />
      <Field
        label="Catégorie / thème"
        value={category}
        change={setCategory}
        max={60}
      />
      <Field
        label="Public conseillé"
        value={audience}
        change={setAudience}
        max={80}
      />
      <Field
        label="Sources facultatives (un lien HTTPS par ligne)"
        value={sources}
        change={setSources}
        max={2500}
        multiline
      />
      <Text style={s.heading}>
        {itemKind === "route"
          ? "Les étapes, dans votre ordre"
          : "Le lieu de votre découverte"}
      </Text>
      {locked && (
        <Text style={s.caption}>
          Étapes figées après publication locale pour préserver le guidage.
          Créez un autre parcours pour changer son trajet.
        </Text>
      )}
      {selected.map((id, index) => (
        <Card key={id}>
          <Text style={s.body}>
            {index + 1}. {monuments.find((m) => m.id === id)?.name}
          </Text>
          {!locked && (
            <View style={{ gap: 6 }}>
              <Button
                secondary
                title="Monter"
                disabled={index === 0}
                onPress={() =>
                  setSelected((ids) => {
                    const next = [...ids];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    return next;
                  })
                }
              />
              <Button
                secondary
                title="Retirer"
                onPress={() =>
                  setSelected((ids) => ids.filter((v) => v !== id))
                }
              />
            </View>
          )}
        </Card>
      ))}
      {!locked && (
        <>
          <Button
            secondary
            title={`Zone : ${city} · changer`}
            onPress={() => setCity((v) => (v === "Lyon" ? "Toutes" : "Lyon"))}
          />
          <Field
            label="Rechercher un monument existant"
            value={search}
            change={setSearch}
          />
          <Text style={s.caption}>
            Premiers résultats affichés. Précisez la recherche pour trouver un autre lieu. Aucun lieu
            privé ni relevé GPS personnel n’est ajouté.
          </Text>
          {matches.map((m) => (
            <Button
              key={m.id}
              secondary
              title={`${selected.includes(m.id) ? "✓ " : "+ "}${m.name} · ${m.city}`}
              disabled={
                selected.includes(m.id) ||
                (itemKind === "route" && selected.length >= 20)
              }
              onPress={() =>
                setSelected((ids) =>
                  itemKind === "discovery" ? [m.id] : [...ids, m.id],
                )
              }
            />
          ))}
        </>
      )}
      <RoutePreview ids={selected} />
      <Card>
        <Text style={s.heading}>Photos privées · couverture facultative</Text>
        <Text style={s.caption}>
          La première photo sert de couverture locale. Elles ne sont pas jointes
          au code partagé. Évitez visages de mineurs, adresses privées et
          informations personnelles.
        </Text>
        <Button
          secondary
          title={
            consent
              ? "✓ J’ai les droits et le consentement nécessaires"
              : "Confirmer mes droits et le consentement photo"
          }
          onPress={() => {
            if (photos.length && consent)
              Alert.alert(
                "Retirez d’abord les photos",
                "Le consentement est nécessaire pour les conserver.",
              );
            else setConsent((v) => !v);
          }}
        />
        <Button
          secondary
          title="Choisir une photo (3 maximum)"
          disabled={!consent || photos.length >= 3 || picking || c.busy}
          onPress={() => {
            setPicking(true);
            void pickDraftPhoto(id)
              .then((photo) => {
                if (photo) {
                  pendingPhotos.current.push(photo.photoUri);
                  setPhotos((p) => [...p, photo.photoUri]);
                }
              })
              .catch((e) => c.setError(String(e)))
              .finally(() => setPicking(false));
          }}
        />
        {photos.map((uri) => (
          <View key={uri} style={{ gap: 5 }}>
            <Image
              source={{ uri }}
              style={{ height: 160, borderRadius: 12 }}
              accessibilityLabel="Photo privée choisie"
            />
            <Button
              secondary
              title="Retirer la photo"
              onPress={() => {
                if (pendingPhotos.current.includes(uri)) {
                  pendingPhotos.current = pendingPhotos.current.filter(
                    (v) => v !== uri,
                  );
                  removeDraftPhoto(uri);
                }
                setPhotos((p) => p.filter((v) => v !== uri));
              }}
            />
          </View>
        ))}
      </Card>
      <Text style={s.caption}>
        N’ajoutez que vos propres textes et photos autorisés. Aucun statut
        historique, XP ou approbation audio n’est attribué à votre publication.
      </Text>
      <Button
        secondary
        title="Enregistrer en brouillon privé"
        disabled={c.busy || picking || !!locked}
        onPress={() => save("draft")}
      />
      <Button
        title={
          prior?.visibility === "local_published"
            ? "Enregistrer les modifications"
            : "Ajouter au fil local · non vérifié"
        }
        disabled={c.busy || picking}
        onPress={() => save("local_published")}
      />
      <Button
        secondary
        title="Annuler"
        onPress={() => {
          photos
            .filter((uri) => !prior?.photos.includes(uri))
            .forEach(removeDraftPhoto);
          router.back();
        }}
      />
    </Page>
  );
}
