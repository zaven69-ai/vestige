import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  poiStatus,
  poiCategory,
  matchesPoi,
  defaultPoiFilters,
  isPublicPoi,
  poiCategories,
  poiStatuses,
} from "../src/lib/poi.ts";
import { viewportGroups } from "../src/lib/mapViewport.ts";
test("OSM and Wikidata references never imply historical verification", () => {
  const imported = {
    origin: "import" as const,
    reviewStatus: "unreviewed" as const,
    description: "Sourced description",
    sourceRefs: [
      { provider: "OpenStreetMap", id: "way/123" },
      { provider: "Wikidata", id: "Q123" },
    ],
  };
  assert.equal(poiStatus(imported), "imported_unreviewed");
  assert.equal(
    poiStatus({ ...imported, reviewStatus: "verified" }),
    "imported_unreviewed",
  );
  assert.equal(poiStatus({}), "imported_unreviewed");
  assert.equal(
    poiStatus({ origin: "editorial", reviewStatus: "unreviewed" }),
    "editorial_unreviewed",
  );
});
test("community verification keeps origin and requires explicit review metadata", () => {
  const poi = {
    origin: "community" as const,
    reviewStatus: "verified" as const,
    verifiedAt: "2026-11-10",
    verifiedBy: "review-fixture",
    contributorId: "test-contributor",
  };
  const before = JSON.stringify(poi);
  assert.equal(poiStatus(poi), "community_verified");
  assert.equal(
    poiStatus({ ...poi, verifiedAt: "invalid" }),
    "community_unreviewed",
  );
  assert.equal(poiStatus({ ...poi, verifiedBy: " " }), "community_unreviewed");
  assert.equal(
    poiStatus({ ...poi, reviewStatus: "pending" }),
    "community_pending",
  );
  assert.equal(
    poiStatus({ ...poi, origin: "editorial" }),
    "editorial_verified",
  );
  assert.equal(JSON.stringify(poi), before);
});
test("rejected contributions never pass public filters; visit and trust filters are independent", () => {
  const filters = defaultPoiFilters();
  assert.equal(
    isPublicPoi({ origin: "community", reviewStatus: "rejected" }),
    false,
  );
  assert.equal(
    matchesPoi(
      { origin: "community", reviewStatus: "rejected" },
      true,
      filters,
    ),
    false,
  );
  const poi = { origin: "import" as const, poiCategory: "museum" as const };
  assert.equal(
    matchesPoi(poi, true, { ...filters, visits: "unvisited" }),
    false,
  );
  assert.equal(matchesPoi(poi, true, { ...filters, visits: "visited" }), true);
  assert.equal(
    matchesPoi(poi, true, { ...filters, statuses: ["editorial_verified"] }),
    false,
  );
  assert.equal(
    matchesPoi(poi, true, { ...filters, categories: ["castle"] }),
    false,
  );
  assert.equal(matchesPoi(poi, false, { ...filters, statuses: [] }), false);
});
test("unknown category falls back to other; every visual has a transparent 3x PNG", () => {
  assert.equal(poiCategory({ category: "Unclassified OSM" }), "other");
  assert.equal(poiCategory({ category: "Édifice religieux" }), "religious");
  assert.notDeepEqual(
    readFileSync(
      new URL("../assets/poi/other-imported_unreviewed.png", import.meta.url),
    ),
    readFileSync(
      new URL("../assets/poi/other-editorial_unreviewed.png", import.meta.url),
    ),
    "the same grey color still uses different provenance symbols",
  );
  for (const category of poiCategories)
    for (const status of poiStatuses) {
      const png = readFileSync(
        new URL(`../assets/poi/${category}-${status}.png`, import.meta.url),
      );
      assert.equal(png.readUInt32BE(16), 156);
      assert.equal(png.readUInt32BE(20), 168);
      assert.equal(png[25], 6);
    }
});
test("clustering bounds native marker views for 791 imported POIs without losing members", () => {
  const points = Array.from({ length: 791 }, (_, i) => ({
    id: String(i),
    latitude: 45 + (i % 29) / 100,
    longitude: 4 + Math.floor(i / 29) / 100,
  }));
  const groups = viewportGroups(
    points,
    {
      latitude: 45.14,
      longitude: 4.14,
      latitudeDelta: 0.3,
      longitudeDelta: 0.3,
    },
    430,
    932,
  );
  assert.ok(groups.length <= 96);
  assert.equal(groups.flatMap((g) => g.members).length, 791);
  assert.equal(
    new Set(groups.flatMap((g) => g.members.map((m) => m.id))).size,
    791,
  );
});
