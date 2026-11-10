import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  newDraft,
  validateDraft,
  parseCommunity,
  type Draft,
} from "../src/lib/contributions/model.ts";
import {
  createCommunityStore,
  COMMUNITY_KEY,
} from "../src/lib/contributions/store.ts";
import { publicShare } from "../src/lib/contributions/share.ts";
import { isPublicPoi } from "../src/lib/poi.ts";
function valid(): Draft {
  return {
    ...newDraft({ latitude: 45.52, longitude: 4.87 }),
    name: "Test fixture",
    content: "Historical claim fixture",
    sources: "https://fr.wikipedia.org/wiki/Vienne_(Is%C3%A8re)",
    privacyConsent: true,
  };
}
test("historical claims need sources and valid coordinates, photo proposals need rights", () => {
  const draft = valid();
  assert.deepEqual(validateDraft(draft), {});
  assert.ok(validateDraft({ ...draft, sources: "" }).sources);
  assert.ok(validateDraft({ ...draft, latitude: "91" }).position);
  assert.ok(
    validateDraft({ ...draft, sources: "javascript:alert(1)" }).sources,
  );
  assert.ok(validateDraft({ ...draft, privacyConsent: false }).privacy);
  assert.ok(validateDraft({ ...draft, kind: "date" }).date);
  assert.equal(
    validateDraft({ ...draft, kind: "date", historicalDate: "Ier siècle" })
      .date,
    undefined,
  );
  const photo = {
    ...draft,
    kind: "photo" as const,
    content: "",
    sources: "",
    photoUri: "file:///private/photo.jpg",
    photoBytes: 1000,
    photoMime: "image/jpeg",
    photoRights: true,
    attribution: "Author fixture",
    license: "CC BY-SA 4.0",
  };
  assert.deepEqual(validateDraft(photo), {});
  assert.ok(validateDraft({ ...photo, photoRights: false }).rights);
  assert.ok(validateDraft({ ...photo, photoBytes: 6000000 }).photo);
});
test("local draft survives a new store instance; writes are serialized without XP or public changes", async () => {
  const values = new Map<string, string>();
  const adapter = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const store = createCommunityStore(adapter),
    draft = valid();
  await Promise.all([store.save(draft), store.toggleFavorite("auguste")]);
  const next = await createCommunityStore(adapter).read();
  assert.equal(next.drafts[0].id, draft.id);
  assert.equal(next.drafts[0].status, "draft");
  assert.deepEqual(next.favorites, ["auguste"]);
  assert.deepEqual([...values.keys()], [COMMUNITY_KEY]);
  await store.remove(draft.id);
  assert.equal((await store.read()).drafts.length, 0);
  assert.equal((await store.read()).favorites.length, 1);
  await store.clear();
  assert.deepEqual(await store.read(), {
    version: 1,
    drafts: [],
    favorites: [],
  });
});
test("failed persistence is surfaced, existing data retained and queue can recover", async () => {
  let raw: string | null = null;
  let fail = true;
  const store = createCommunityStore({
    getItem: async () => raw,
    setItem: async (_key, value) => {
      if (fail) throw Error("disk full");
      raw = value;
    },
  });
  await assert.rejects(store.save(valid()), /disk full/);
  assert.equal(raw, null);
  fail = false;
  await store.save(valid());
  assert.equal((await store.read()).drafts.length, 1);
  assert.throws(
    () =>
      parseCommunity(
        JSON.stringify({
          version: 1,
          drafts: [{ ...valid(), status: "accepted" }],
          favorites: [],
        }),
      ),
    /invalide/,
  );
  assert.throws(() => parseCommunity("{broken"));
});
test("share fallback is a public HTTPS source with no location, journal, tracking or app-only link", () => {
  const poi = {
    name: "Temple",
    source:
      "https://www.openstreetmap.org/way/123?lat=45.123&user=secret#map=19/45/4",
    fix: { latitude: 48, longitude: 2 },
    xp: 900,
    journal: { secret: true },
  };
  const share = publicShare(poi);
  assert.equal(share.url, "https://www.openstreetmap.org/way/123");
  assert.doesNotMatch(share.message, /secret|lat=|900|vestige:\/\//);
  assert.throws(() =>
    publicShare({ name: "Bad", source: "javascript:alert(1)" }),
  );
  assert.throws(() =>
    publicShare({
      name: "Bad",
      source: "https://openstreetmap.org.attacker.example/x",
    }),
  );
});
test("pending and rejected community proposals never become public POIs", () => {
  assert.equal(
    isPublicPoi({ origin: "community", reviewStatus: "pending" }),
    false,
  );
  assert.equal(
    isPublicPoi({ origin: "community", reviewStatus: "rejected" }),
    false,
  );
  assert.equal(
    isPublicPoi({ origin: "import", reviewStatus: "unreviewed" }),
    true,
  );
});
test("eight landmark miniatures exist and are visually distinct without granting verification", () => {
  const ids = [
    "auguste",
    "theatre-vienne",
    "saint-maurice",
    "saint-andre",
    "fourviere",
    "theatre-lyon",
    "saint-jean",
    "amphitheatre",
  ];
  const fingerprints = ids.map((id) => {
    const png = readFileSync(
      new URL(
        `../assets/poi/landmarks/${id}-editorial_unreviewed.png`,
        import.meta.url,
      ),
    );
    assert.equal(png.readUInt32BE(16), 156);
    assert.equal(png.readUInt32BE(20), 168);
    return png.toString("base64");
  });
  assert.equal(new Set(fingerprints).size, 8);
});

test("explicit deletion recovers corrupted local contribution data without touching progression", async () => {
  let raw = "{broken";
  const touched: string[] = [];
  const store = createCommunityStore({
    getItem: async () => raw,
    setItem: async (key, value) => {
      touched.push(key);
      raw = value;
    },
  });
  await assert.rejects(store.read());
  await assert.rejects(store.save(valid()));
  assert.equal(raw, "{broken");
  await store.clear();
  assert.equal((await store.read()).drafts.length, 0);
  assert.deepEqual(touched, [COMMUNITY_KEY]);
});
