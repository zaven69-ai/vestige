// Run against a test instance with the route migration and two confirmed accounts.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const required = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "VESTIGE_TEST_A_EMAIL",
  "VESTIGE_TEST_A_PASSWORD",
  "VESTIGE_TEST_B_EMAIL",
  "VESTIGE_TEST_B_PASSWORD",
];
for (const variable of required) {
  if (!process.env[variable]) throw new Error(`Variable requise : ${variable}`);
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(
  key.startsWith("sb_publishable_"),
  "Utiliser une clé publique Supabase.",
);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const a = createClient(url, key, options);
const b = createClient(url, key, options);

async function data(request) {
  const result = await request;
  if (result.error)
    throw new Error(`Supabase : ${result.error.code ?? result.error.name}`);
  return result.data;
}

const credentials = (account) => ({
  email: process.env[`VESTIGE_TEST_${account}_EMAIL`],
  password: process.env[`VESTIGE_TEST_${account}_PASSWORD`],
});
const title = `Test Vestige Lyon ${crypto.randomUUID()}`;
let routeId;
let postId;

try {
  const owner = (await data(a.auth.signInWithPassword(credentials("A")))).user
    .id;
  const reader = (await data(b.auth.signInWithPassword(credentials("B")))).user
    .id;
  assert.notEqual(owner, reader, "Deux comptes distincts sont requis.");
  assert.equal(
    (await data(a.from("profiles").select("id").eq("id", owner).single())).id,
    owner,
  );
  const route = {
    p_title: title,
    p_description: "Vérification du partage de Lyon",
    p_category: "Patrimoine",
    p_poi_ids: ["saint-jean", "fourviere"],
  };
  routeId = await data(
    a.rpc("vestige_save_route", {
      ...route,
      p_id: null,
      p_visibility: "draft",
    }),
  );
  postId = (
    await data(
      a
        .from("community_posts")
        .insert({
          author_id: owner,
          poi_id: "fourviere",
          title,
          body: route.p_description,
        })
        .select("id")
        .single(),
    )
  ).id;

  assert.deepEqual(
    await data(b.from("community_routes").select("id").eq("id", routeId)),
    [],
  );
  assert.deepEqual(
    await data(b.from("community_posts").select("id").eq("id", postId)),
    [],
  );
  await data(
    a.rpc("vestige_save_route", {
      ...route,
      p_id: routeId,
      p_visibility: "published",
    }),
  );
  await data(
    a
      .from("community_posts")
      .update({ visibility: "published" })
      .eq("id", postId)
      .select("id")
      .single(),
  );

  const shared = await data(
    b
      .from("community_routes")
      .select("id,community_route_stops(position,poi_id)")
      .eq("id", routeId)
      .single(),
  );
  assert.deepEqual(
    shared.community_route_stops
      .sort((x, y) => x.position - y.position)
      .map((stop) => stop.poi_id),
    route.p_poi_ids,
  );
  assert.equal(
    (
      await data(
        b.from("community_posts").select("id").eq("id", postId).single(),
      )
    ).id,
    postId,
  );
  assert.deepEqual(
    await data(
      b.from("community_posts").delete().eq("id", postId).select("id"),
    ),
    [],
  );
  assert.deepEqual(
    await data(
      b
        .from("community_routes")
        .update({ title: "Modification" })
        .eq("id", routeId)
        .select("id"),
    ),
    [],
  );
  const foreign = await b.rpc("vestige_save_route", {
    ...route,
    p_id: routeId,
    p_visibility: "published",
  });
  assert.equal(foreign.error?.code, "42501");
  await data(
    b
      .from("saved_community_routes")
      .insert({ user_id: reader, route_id: routeId }),
  );
  assert.deepEqual(
    await data(
      a
        .from("saved_community_routes")
        .select("route_id")
        .eq("route_id", routeId),
    ),
    [],
  );
  console.log("Connexion et partage Supabase A/B vérifiés.");
} finally {
  const cleanup = await Promise.all([
    ...(routeId ? [a.from("community_routes").delete().eq("id", routeId)] : []),
    ...(postId ? [a.from("community_posts").delete().eq("id", postId)] : []),
  ]);
  await Promise.all([
    a.auth.signOut({ scope: "local" }),
    b.auth.signOut({ scope: "local" }),
  ]);
  if (cleanup.some((result) => result.error)) {
    throw new Error(
      `Nettoyage incomplet. Parcours : ${routeId ?? "absent"}. Publication : ${postId ?? "absente"}.`,
    );
  }
}
