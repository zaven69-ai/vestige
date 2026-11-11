import { test } from "node:test";
import assert from "node:assert/strict";
import { createSocialStore, SOCIAL_KEY } from "../src/lib/community/store.ts";
import {
  contentFields,
  shareCode,
  importCode,
  communityTours,
  type CommunityItem,
} from "../src/lib/community/model.ts";
import {
  editoriallyApproved,
  playableAsset,
} from "../src/lib/live/eligibility.ts";
import {
  startVisit,
  advanceVisit,
  restoreVisit,
} from "../src/lib/live/session.ts";
const known = new Set(["saint-jean", "fourviere", "theatre-lyon"]);
function item(): CommunityItem {
  return {
    id: "social-fixture",
    kind: "route",
    title: "Test de parcours",
    text: "Texte de test sans affirmation historique.",
    period: "Période de test",
    category: "Architecture",
    audience: "Tous publics",
    poiIds: ["saint-jean", "fourviere"],
    sources: ["https://fr.wikipedia.org/wiki/Lyon"],
    photos: [],
    photoConsent: false,
    author: { alias: "Pseudo de test", bio: "", city: "", avatar: "book" },
    owned: true,
    visibility: "draft",
    contentStatus: "community_published_unverified",
    createdAt: 1,
    updatedAt: 1,
  };
}
function fixture() {
  const values = new Map<string, string>();
  const storage = {
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
  };
  return { values, storage, store: createSocialStore(storage, known) };
}
test("create, edit, publish, save, reload and delete are durable and isolated from game keys", async () => {
  const { store, values, storage } = fixture(),
    i = item();
  await store.save(i);
  await store.save({
    ...i,
    title: "Titre modifié",
    visibility: "local_published",
  });
  await Promise.all([
    store.toggleSaved(i.id),
    store.profile({
      alias: "Auteur local",
      bio: "Ma bio",
      city: "Lyon",
      avatar: "temple",
    }),
  ]);
  const s = await createSocialStore(storage, known).read();
  assert.equal(s.items[0].title, "Titre modifié");
  assert.equal(s.items[0].author.alias, "Auteur local");
  assert.deepEqual(s.saved, [i.id]);
  assert.deepEqual([...values.keys()], [SOCIAL_KEY]);
  await store.remove(i.id);
  assert.equal((await store.read()).items.length, 0);
  assert.deepEqual((await store.read()).saved, []);
});
test("copies between isolated devices need explicit import and cannot edit original author", async () => {
  const a = fixture(),
    b = fixture(),
    pub = { ...item(), visibility: "local_published" as const };
  await a.store.save(pub);
  assert.equal((await b.store.read()).items.length, 0);
  const imported = importCode(shareCode(pub), known, "social-import", 2);
  await b.store.import(imported);
  assert.equal((await b.store.read()).items[0].owned, false);
  await assert.rejects(
    b.store.save({ ...imported, owned: true, title: "Usurpation" }),
    /auteur/,
  );
  await b.store.remove(imported.id);
  assert.equal((await a.store.read()).items.length, 1);
});
test("share whitelist contains no photo, GPS, journal, badges, XP, identity key or approval", () => {
  const pub = {
    ...item(),
    visibility: "local_published" as const,
    photos: ["file:///phone/vestige-contribution-photos/test.jpg"],
    photoConsent: true,
    gps: { latitude: 99 },
    journal: { private: 1 },
    xp: 200,
    accountId: "secret",
    approval: { humanReview: true },
  };
  const code = shareCode(pub),
    payload = JSON.parse(decodeURIComponent(code.slice(9)));
  for (const field of [
    "photos",
    "gps",
    "journal",
    "xp",
    "accountId",
    "approval",
  ]) {
    assert.ok(!(field in payload));
    assert.ok(!(field in payload.content));
  }
  assert.deepEqual(Object.keys(payload.author).sort(), [
    "alias",
    "avatar",
    "bio",
    "city",
  ]);
  assert.throws(() => shareCode(item()), /fil local/);
});
test("untrusted imports cannot elevate status, claim ownership or inject audio / photos", () => {
  const code =
    "VESTIGE1:" +
    encodeURIComponent(
      JSON.stringify({
        version: 1,
        author: item().author,
        content: {
          ...contentFields(item()),
          owned: true,
          contentStatus: "live_editorial_approved",
          storyId: "george",
          photos: ["https://tracking.test/photo"],
        },
      }),
    );
  const incoming = importCode(code, known, "social-import", 4);
  assert.equal(incoming.contentStatus, "community_published_unverified");
  assert.equal(incoming.owned, false);
  assert.deepEqual(incoming.photos, []);
  assert.ok(!("storyId" in incoming));
});
test("invalid, oversized, duplicate, missing or unknown steps fail closed", () => {
  const pub = { ...item(), visibility: "local_published" as const };
  for (const i of [
    { ...pub, poiIds: ["unknown", "fourviere"] },
    { ...pub, poiIds: ["fourviere", "fourviere"] },
    { ...pub, poiIds: ["fourviere"] },
    { ...pub, sources: ["javascript:alert(1)"] },
  ]) {
    assert.throws(() => importCode(shareCode(i), known, "social-import", 4));
  }
  assert.throws(() =>
    importCode("VESTIGE1:" + "x".repeat(16001), known, "social-import", 4),
  );
  assert.throws(() => importCode("VESTIGE1:%E0", known, "social-import", 4));
});
test("local photo consent and rights enforced; foreign or unapproved status cannot be persisted", async () => {
  const { store } = fixture();
  await assert.rejects(
    store.save({
      ...item(),
      photos: ["file:///phone/vestige-contribution-photos/a.jpg"],
    }),
    /Photos/,
  );
  await assert.rejects(
    store.save({
      ...item(),
      photos: ["https://tracker.test/a.jpg"],
      photoConsent: true,
    }),
    /Photos/,
  );
  await assert.rejects(
    store.save({ ...item(), contentStatus: "historically_verified" as any }),
    /invalide/,
  );
});
test("published route steps stay stable across edits and checkpoint restoration", async () => {
  const { store } = fixture(),
    pub = { ...item(), visibility: "local_published" as const };
  await store.save(pub);
  await assert.rejects(
    store.save({ ...pub, poiIds: ["fourviere", "saint-jean"] }),
    /Dupliquez/,
  );
  const routes = communityTours(
    [pub, item()],
    [...known].map((id) => ({
      id,
      latitude: 45,
      longitude: 4,
      source: "https://example.org",
    })),
  );
  assert.equal(routes.length, 1);
  assert.equal(routes[0].presenceRequired, true);
  assert.ok(routes[0].stops.every((s) => s.storyId === "" && !s.history));
  const session = advanceVisit(
    startVisit(routes[0], 1),
    routes[0],
    "consulted",
    2,
  );
  assert.deepEqual(restoreVisit(JSON.stringify(session), routes[0]), session);
});
test("no unverified community content can satisfy editorial audio admission", () => {
  const s = {
    ...item(),
    origin: "community",
    status: "community_published_unverified",
    sources: [],
    approval: null,
    audioId: "George",
  } as any;
  assert.equal(editoriallyApproved(s), false);
  assert.equal(playableAsset(s, {}), null);
});
test("reports hide locally, have rate limits and do not claim remote moderation", async () => {
  const { store } = fixture(),
    pub = { ...item(), visibility: "local_published" as const };
  await store.save(pub);
  await store.report(pub.id, "Motif test", 1000);
  assert.deepEqual((await store.read()).hidden, [pub.id]);
  for (let n = 1; n < 10; n++)
    await store.report(pub.id, "Autre motif", 1000 + n);
  await assert.rejects(
    store.report(pub.id, "Trop de rapports", 2000),
    /Limite/,
  );
});
test("write failure surfaces without destroying state and next operation recovers", async () => {
  let value: string | null = null,
    fail = true;
  const store = createSocialStore(
    {
      getItem: async () => value,
      setItem: async (_, next) => {
        if (fail) throw Error("disk full");
        value = next;
      },
    },
    known,
  );
  await assert.rejects(store.save(item()), /disk full/);
  assert.equal(value, null);
  fail = false;
  await store.save(item());
  assert.equal((await store.read()).items.length, 1);
});
test("corrupt social storage is retained until explicit reset, with other storage keys intact", async () => {
  const { store, values } = fixture();
  values.set(SOCIAL_KEY, "corrupt");
  values.set("@vestige/journal", "private");
  await assert.rejects(store.save(item()));
  assert.equal(values.get(SOCIAL_KEY), "corrupt");
  await store.clear();
  assert.equal(values.get("@vestige/journal"), "private");
});
