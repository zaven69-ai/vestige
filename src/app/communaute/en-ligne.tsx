import React, { useEffect, useState } from "react";
import { Alert, Text } from "react-native";
import { router } from "expo-router";
import { Badge, Button, Card, Page, s } from "../../components/ui";
import { ErrorNotice, Field } from "../../components/community/Common";
import { useCommunity } from "../../lib/community/CommunityProvider";
import type { CommunityItem } from "../../lib/community/model";
import { useLive } from "../../lib/live/LiveProvider";
import { supabase } from "../../lib/supabase/client";
import { useSupabaseSession } from "../../lib/supabase/SessionProvider";
import { validateCommunityItem } from "../../lib/supabase/community";
import { monuments } from "../../data/monuments";

type Post = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  visibility: "draft" | "published";
};
type Profile = {
  username: string | null;
  display_name: string | null;
  bio: string | null;
};

function message(error: unknown) {
  const { code, message: detail } = (error ?? {}) as {
    code?: string;
    message?: string;
  };
  if (code === "email_not_confirmed")
    return "Confirmez votre adresse e-mail avant de vous connecter.";
  if (code === "invalid_credentials")
    return "Adresse e-mail ou mot de passe incorrect.";
  if (code === "42501") return "Votre compte n’a pas accès à cette action.";
  if (code === "23505") return "Cette valeur est déjà utilisée.";
  if (/fetch|network/i.test(detail ?? ""))
    return "Connexion à Vestige indisponible. Réessayez.";
  return error instanceof Error
    ? error.message
    : "L’opération a échoué. Réessayez.";
}

function useRequest() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}

export default function OnlineCommunity() {
  const { ready, session } = useSupabaseSession();
  return (
    <Page eyebrow="Vestige" title="Communauté en ligne">
      {!supabase ? (
        <Text style={s.body}>
          La connexion Supabase doit être configurée sur cette version de
          Vestige.
        </Text>
      ) : !ready ? (
        <Text style={s.body}>Récupération de la session…</Text>
      ) : session ? (
        <OnlineFeed key={session.user.id} account={session.user.id} />
      ) : (
        <AccountForm />
      )}
    </Page>
  );
}

function AccountForm() {
  const request = useRequest();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");

  const authenticate = (signup: boolean) =>
    request.run(async () => {
      setNotice("");
      const client = supabase!;
      const credentials = { email: email.trim(), password };
      const { data, error } = signup
        ? await client.auth.signUp(credentials)
        : await client.auth.signInWithPassword(credentials);
      if (error) throw error;
      if (!data.session)
        setNotice(
          "Consultez votre boîte e-mail pour confirmer votre inscription.",
        );
    });

  return (
    <Card>
      <Text style={s.heading}>Compte Vestige</Text>
      <ErrorNotice message={request.error} />
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={s.body}>
          {notice}
        </Text>
      )}
      <Field
        email
        label="Adresse e-mail"
        value={email}
        change={setEmail}
        max={254}
      />
      <Field
        password
        label="Mot de passe"
        value={password}
        change={setPassword}
        max={128}
      />
      <Button
        title="Se connecter"
        disabled={request.busy || !email.trim() || !password}
        onPress={() => void authenticate(false)}
      />
      <Button
        secondary
        title="Créer un compte"
        disabled={request.busy || !email.trim() || password.length < 6}
        onPress={() => void authenticate(true)}
      />
    </Card>
  );
}

function OnlineFeed({ account }: { account: string }) {
  const community = useCommunity();
  const { refreshRemote } = community;
  const live = useLive();
  const request = useRequest();
  const { setError } = request;
  const [posts, setPosts] = useState<Post[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<{ id: string; reason: string }[]>([]);
  const [report, setReport] = useState("");
  const [selected, setSelected] = useState<CommunityItem | null>(null);
  const [edit, setEdit] = useState<{
    id: string;
    kind: "route" | "discovery";
    title: string;
    text: string;
    category?: string;
    poiIds?: string[];
  } | null>(null);

  async function load() {
    const client = supabase!;
    const [postResult, savedResult, reportResult] = await Promise.all([
      client
        .from("community_posts")
        .select("id,author_id,title,body,visibility")
        .order("updated_at", { ascending: false })
        .returns<Post[]>(),
      client.from("saved_community_routes").select("route_id"),
      client
        .from("community_reports")
        .select("id,reason")
        .order("created_at", { ascending: false }),
      refreshRemote(),
    ]);
    if (postResult.error) throw postResult.error;
    if (savedResult.error) throw savedResult.error;
    if (reportResult.error) throw reportResult.error;
    setPosts(postResult.data);
    setSaved(savedResult.data.map((row) => row.route_id));
    setReports(reportResult.data);
  }

  useEffect(() => {
    const client = supabase!;
    let active = true;
    void Promise.all([
      client
        .from("community_posts")
        .select("id,author_id,title,body,visibility")
        .order("updated_at", { ascending: false })
        .returns<Post[]>(),
      client.from("saved_community_routes").select("route_id"),
      client
        .from("community_reports")
        .select("id,reason")
        .order("created_at", { ascending: false }),
      client
        .from("profiles")
        .select("username,display_name,bio")
        .eq("id", account)
        .single<Profile>(),
    ]).then(([postResult, savedResult, reportResult, profileResult]) => {
      if (!active) return;
      const error =
        postResult.error ??
        savedResult.error ??
        reportResult.error ??
        profileResult.error;
      if (error) setError(message(error));
      setPosts(postResult.data ?? []);
      setSaved((savedResult.data ?? []).map((row) => row.route_id));
      setReports(reportResult.data ?? []);
      setProfile(profileResult.data);
    });
    return () => {
      active = false;
    };
  }, [account, setError]);

  function confirmDelete(kind: "route" | "discovery", id: string) {
    Alert.alert(
      "Supprimer cette création ?",
      "Elle sera retirée de la communauté en ligne.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () =>
            void request.run(async () => {
              const { error } = await supabase!
                .from(kind === "route" ? "community_routes" : "community_posts")
                .delete()
                .eq("id", id)
                .eq("author_id", account)
                .select("id")
                .single();
              if (error) throw error;
              await load();
            }),
        },
      ],
    );
  }

  function share(item: CommunityItem, visibility: "draft" | "published") {
    return request.run(async () => {
      validateCommunityItem(item);
      const client = supabase!;
      const { error } =
        item.kind === "route"
          ? await client.rpc("vestige_save_route", {
              p_id: null,
              p_title: item.title,
              p_description: item.text,
              p_category: item.category,
              p_poi_ids: item.poiIds,
              p_visibility: visibility,
            })
          : await client.from("community_posts").insert({
              author_id: account,
              title: item.title,
              body: item.text,
              poi_id: item.poiIds[0],
              visibility,
            });
      if (error) throw error;
      setSelected(null);
      await load();
    });
  }

  function reportItem(kind: "route" | "discovery", id: string) {
    return request.run(async () => {
      const { error } = await supabase!.from("community_reports").insert({
        reporter_id: account,
        [kind === "route" ? "route_id" : "post_id"]: id,
        reason: report.trim(),
      });
      if (error) throw error;
      setReport("");
      await load();
    });
  }

  return (
    <>
      <ErrorNotice message={request.error} />
      <Button
        secondary
        title="Se déconnecter"
        disabled={request.busy}
        onPress={() =>
          void request.run(async () => {
            const { error } = await supabase!.auth.signOut({ scope: "local" });
            if (error) throw error;
          })
        }
      />
      {profile && (
        <Card>
          <Text style={s.heading}>Mon profil public</Text>
          <Field
            label="Pseudo"
            value={profile.username ?? ""}
            change={(username) => setProfile({ ...profile, username })}
            max={30}
          />
          <Field
            label="Nom affiché"
            value={profile.display_name ?? ""}
            change={(display_name) => setProfile({ ...profile, display_name })}
            max={80}
          />
          <Field
            label="Bio"
            value={profile.bio ?? ""}
            change={(bio) => setProfile({ ...profile, bio })}
            max={300}
            multiline
          />
          <Button
            secondary
            title="Enregistrer mon profil"
            disabled={request.busy}
            onPress={() =>
              void request.run(async () => {
                const username = profile.username?.trim() || null;
                if (username && !/^[A-Za-z0-9_]{3,30}$/.test(username))
                  throw new Error(
                    "Le pseudo doit contenir 3 à 30 lettres, chiffres ou tirets bas.",
                  );
                const { error } = await supabase!
                  .from("profiles")
                  .update({
                    username,
                    display_name: profile.display_name?.trim() || null,
                    bio: profile.bio?.trim() || null,
                  })
                  .eq("id", account);
                if (error) throw error;
                await load();
              })
            }
          />
        </Card>
      )}
      <Card>
        <Text style={s.heading}>Partager une création de cet appareil</Text>
        <Text style={s.caption}>
          Le partage en ligne copie le titre, le récit et les étapes. Les photos
          et les sources ajoutées localement restent dans la version locale.
        </Text>
        {community.state.items
          .filter((item) => item.owned)
          .map((item) => (
            <Button
              key={item.id}
              secondary
              title={item.title}
              disabled={request.busy}
              onPress={() => setSelected(item)}
            />
          ))}
        {!community.state.items.some((item) => item.owned) && (
          <Button
            secondary
            title="Créer un parcours"
            onPress={() => router.push("/communaute/creer")}
          />
        )}
        {selected && (
          <>
            <Text style={s.body}>{selected.title}</Text>
            <Button
              secondary
              title="Copier en brouillon privé"
              disabled={request.busy}
              onPress={() => void share(selected, "draft")}
            />
            <Button
              title="Publier en ligne"
              disabled={request.busy}
              onPress={() => void share(selected, "published")}
            />
          </>
        )}
      </Card>
      <Button
        secondary
        title="Actualiser le fil"
        disabled={request.busy}
        onPress={() => void request.run(load)}
      />
      {edit && (
        <Card>
          <Text style={s.heading}>Modifier la création</Text>
          <Field
            label="Titre"
            value={edit.title}
            change={(title) => setEdit({ ...edit, title })}
            max={120}
          />
          <Field
            label="Récit"
            value={edit.text}
            change={(text) => setEdit({ ...edit, text })}
            max={edit.kind === "route" ? 3000 : 5000}
            multiline
          />
          <Button
            title="Enregistrer les modifications"
            disabled={
              request.busy ||
              edit.title.trim().length < 3 ||
              (edit.kind === "discovery" && !edit.text.trim())
            }
            onPress={() =>
              void request.run(async () => {
                const route = community.remoteItems.find(
                  (item) => item.id === edit.id,
                );
                const { error } =
                  edit.kind === "route"
                    ? await supabase!.rpc("vestige_save_route", {
                        p_id: edit.id,
                        p_title: edit.title,
                        p_description: edit.text,
                        p_category: edit.category,
                        p_poi_ids: edit.poiIds,
                        p_visibility:
                          route?.visibility === "draft" ? "draft" : "published",
                      })
                    : await supabase!
                        .from("community_posts")
                        .update({
                          title: edit.title.trim(),
                          body: edit.text.trim(),
                        })
                        .eq("id", edit.id)
                        .eq("author_id", account)
                        .select("id")
                        .single();
                if (error) throw error;
                setEdit(null);
                await load();
              })
            }
          />
          <Button
            secondary
            title="Annuler la modification"
            onPress={() => setEdit(null)}
          />
        </Card>
      )}
      <Field
        label="Motif du signalement"
        value={report}
        change={setReport}
        max={1000}
      />
      <Text style={s.heading}>Parcours en ligne</Text>
      {community.remoteItems.map((item) => (
        <Card key={item.id}>
          <Text style={s.heading}>{item.title}</Text>
          <Badge tone="coral">
            {item.visibility === "draft"
              ? "Brouillon privé"
              : "Parcours communautaire · non vérifié"}
          </Badge>
          <Text style={s.caption}>{item.author.alias}</Text>
          <Text style={s.body}>{item.text}</Text>
          {item.poiIds.map((id, i) => (
            <Text key={id} style={s.caption}>
              {i + 1}.{" "}
              {monuments.find((poi) => poi.id === id)?.name ??
                "Lieu indisponible"}
            </Text>
          ))}
          {item.visibility !== "draft" && (
            <>
              <Button
                title="Lancer dans Explorer"
                disabled={
                  !live.ready ||
                  !!live.storageError ||
                  !item.poiIds.every((id) =>
                    monuments.some((poi) => poi.id === id),
                  )
                }
                onPress={() => {
                  live.begin(item.id);
                  router.navigate({
                    pathname: "/(tabs)",
                    params: { guide: "start", command: String(Date.now()) },
                  });
                }}
              />
              <Button
                secondary
                title={
                  saved.includes(item.id)
                    ? "Retirer des favoris"
                    : "Enregistrer le parcours"
                }
                disabled={request.busy}
                onPress={() =>
                  void request.run(async () => {
                    const table = supabase!.from("saved_community_routes");
                    const { error } = saved.includes(item.id)
                      ? await table
                          .delete()
                          .eq("user_id", account)
                          .eq("route_id", item.id)
                      : await table.upsert(
                          { user_id: account, route_id: item.id },
                          { ignoreDuplicates: true },
                        );
                    if (error) throw error;
                    await load();
                  })
                }
              />
              <Button
                secondary
                title="Signaler ce parcours"
                disabled={request.busy || report.trim().length < 3}
                onPress={() => void reportItem("route", item.id)}
              />
            </>
          )}
          {item.owned && (
            <>
              <Button
                secondary
                title="Modifier le titre ou le récit"
                disabled={request.busy}
                onPress={() =>
                  setEdit({
                    id: item.id,
                    kind: "route",
                    title: item.title,
                    text: item.text,
                    category: item.category,
                    poiIds: item.poiIds,
                  })
                }
              />
              {item.visibility === "draft" && (
                <Button
                  title="Publier ce parcours"
                  disabled={request.busy}
                  onPress={() =>
                    void request.run(async () => {
                      validateCommunityItem(item);
                      const { error } = await supabase!.rpc(
                        "vestige_save_route",
                        {
                          p_id: item.id,
                          p_title: item.title,
                          p_description: item.text,
                          p_category: item.category,
                          p_poi_ids: item.poiIds,
                          p_visibility: "published",
                        },
                      );
                      if (error) throw error;
                      await load();
                    })
                  }
                />
              )}
              <Button
                secondary
                title="Supprimer mon parcours"
                disabled={request.busy}
                onPress={() => confirmDelete("route", item.id)}
              />
            </>
          )}
        </Card>
      ))}
      <Text style={s.heading}>Découvertes en ligne</Text>
      {posts.map((post) => (
        <Card key={post.id}>
          <Text style={s.heading}>{post.title}</Text>
          <Badge tone="coral">
            {post.visibility === "draft"
              ? "Brouillon privé"
              : "Découverte communautaire · non vérifiée"}
          </Badge>
          <Text style={s.body}>{post.body}</Text>
          {post.visibility === "published" && (
            <Button
              secondary
              title="Signaler cette découverte"
              disabled={request.busy || report.trim().length < 3}
              onPress={() => void reportItem("discovery", post.id)}
            />
          )}
          {post.author_id === account && (
            <>
              <Button
                secondary
                title="Modifier ma découverte"
                disabled={request.busy}
                onPress={() =>
                  setEdit({
                    id: post.id,
                    kind: "discovery",
                    title: post.title,
                    text: post.body,
                  })
                }
              />
              {post.visibility === "draft" && (
                <Button
                  title="Publier cette découverte"
                  disabled={request.busy}
                  onPress={() =>
                    void request.run(async () => {
                      const { error } = await supabase!
                        .from("community_posts")
                        .update({ visibility: "published" })
                        .eq("id", post.id)
                        .eq("author_id", account)
                        .select("id")
                        .single();
                      if (error) throw error;
                      await load();
                    })
                  }
                />
              )}
              <Button
                secondary
                title="Supprimer ma découverte"
                disabled={request.busy}
                onPress={() => confirmDelete("discovery", post.id)}
              />
            </>
          )}
        </Card>
      ))}
      <Text style={s.heading}>Mes signalements</Text>
      {reports.map((entry) => (
        <Text key={entry.id} style={s.body}>
          {entry.reason}
        </Text>
      ))}
    </>
  );
}
