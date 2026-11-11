import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  viewportGroups,
  clusterTarget,
  coincidentPois,
} from "../src/lib/mapViewport.ts";
const region = {
  latitude: 45.525,
  longitude: 4.875,
  latitudeDelta: 0.04,
  longitudeDelta: 0.025,
};
const points = Array.from({ length: 25 }, (_, i) => ({
  id: `vienne-${i}`,
  latitude: region.latitude + (Math.floor(i / 5) - 2) * 0.00012,
  longitude: region.longitude + ((i % 5) - 2) * 0.00015,
}));
const group = (delta: number) =>
  viewportGroups(
    points,
    { ...region, latitudeDelta: delta, longitudeDelta: delta * 0.625 },
    390,
    800,
  );
test("dense Vienne fixture splits progressively down to individual illustrated POIs", () => {
  const counts = [0.04, 0.01, 0.004, 0.002].map((d) => group(d).length);
  for (let i = 1; i < counts.length; i++)
    assert.ok(counts[i] >= counts[i - 1], String(counts));
  assert.ok(counts[0] < points.length);
  assert.equal(counts.at(-1), points.length);
  assert.ok(group(0.002).every((g) => g.members.length === 1));
});
test("sparse distant POIs stay individual instead of sharing an arbitrary grid cell", () => {
  const sparse = [
    { id: "a", latitude: 45.525, longitude: 4.875 },
    { id: "b", latitude: 45.525, longitude: 4.878 },
  ];
  assert.equal(
    viewportGroups(
      sparse,
      { ...region, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      390,
      800,
    ).length,
    2,
  );
});
test("close-up locations are all individual; a tapped co-located marker offers every identity", () => {
  const close = [
    { id: "a", latitude: 45.525, longitude: 4.875 },
    { id: "b", latitude: 45.52509, longitude: 4.875 },
    { id: "c", latitude: 45.525001, longitude: 4.875 },
  ];
  const groups = viewportGroups(
    close,
    { ...region, latitudeDelta: 0.002, longitudeDelta: 0.002 },
    390,
    800,
  );
  assert.equal(groups.length, 3);
  assert.ok(groups.every((g) => g.members.length === 1));
  const choices = coincidentPois(close[0], close);
  assert.deepEqual(
    choices.map((p) => p.id),
    ["a", "c"],
  );
  assert.equal(clusterTarget(choices), null);
});
test("cluster touch fits member bounds instead of halving the current zoom blindly", () => {
  const target = clusterTarget(points)!;
  assert.ok(target.latitudeDelta < region.latitudeDelta / 2);
  for (const p of points) {
    assert.ok(
      Math.abs(p.latitude - target.latitude) <= target.latitudeDelta / 2,
    );
    assert.ok(
      Math.abs(p.longitude - target.longitude) <= target.longitudeDelta / 2,
    );
  }
  assert.equal(clusterTarget([]), null);
});
test("hundreds of visible imports retain every identity, including at maximum zoom", () => {
  const dense = Array.from({ length: 900 }, (_, i) => ({
    id: String(i),
    latitude: 45.525 + (i % 30) * 0.00002,
    longitude: 4.875 + Math.floor(i / 30) * 0.00003,
  }));
  for (const delta of [0.1, 0.02, 0.005, 0.002]) {
    const groups = viewportGroups(
      dense,
      { ...region, latitudeDelta: delta, longitudeDelta: delta },
      390,
      800,
    );
    const ids = groups.flatMap((g) => g.members.map((p) => p.id));
    assert.equal(ids.length, dense.length);
    assert.equal(new Set(ids).size, dense.length);
    if (delta > 0.03) assert.ok(groups.length <= 96);
  }
});
test("grouping is deterministic across import order and excludes only offscreen points", () => {
  const a = group(0.01),
    b = viewportGroups(
      [...points].reverse(),
      { ...region, latitudeDelta: 0.01, longitudeDelta: 0.00625 },
      390,
      800,
    );
  assert.deepEqual(a, b);
  const far = { id: "lyon", latitude: 45.76, longitude: 4.82 };
  assert.equal(
    viewportGroups([...points, far], region, 390, 800).flatMap((g) => g.members)
      .length,
    points.length,
  );
});
test("cluster renderer has no decorative pseudo-digits and Explorer preserves native illustrated pins", () => {
  const source = readFileSync(
    new URL(
      "../src/components/exploration/PoiClusterMarker.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.ok(!source.includes("[0, 1, 2]"));
  assert.match(source, /group\.members\.length/);
  const explorer = readFileSync(
    new URL("../src/app/(tabs)/index.tsx", import.meta.url),
    "utf8",
  );
  assert.match(explorer, /<IllustratedPoiMarker/);
  assert.match(explorer, /clusterTarget\(group.members\)/);
});

test("real Vienne catalogue shows mostly individual POIs at city scale and retains visible identities", () => {
  const catalogue = JSON.parse(
    readFileSync(
      new URL("../src/data/generated/heritage.json", import.meta.url),
      "utf8",
    ),
  );
  const view = { ...region, latitudeDelta: 0.025, longitudeDelta: 0.015 };
  const groups = viewportGroups(catalogue, view, 390, 800);
  assert.ok(
    groups.filter((g) => g.members.length === 1).length >
      groups.filter((g) => g.members.length > 1).length,
  );
  const expected = catalogue.filter(
    (p: { latitude: number; longitude: number }) =>
      Math.abs(p.latitude - view.latitude) <= view.latitudeDelta * 0.6 &&
      Math.abs(p.longitude - view.longitude) <= view.longitudeDelta * 0.6,
  );
  assert.deepEqual(
    groups.flatMap((g) => g.members.map((p) => p.id)).sort(),
    expected.map((p: { id: string }) => p.id).sort(),
  );
});

test("all 791 imported records are included in city-zoom regression coverage", () => {
  const imports = JSON.parse(
    readFileSync(
      new URL("../src/data/imported-pois.json", import.meta.url),
      "utf8",
    ),
  );
  const editorial = JSON.parse(
    readFileSync(
      new URL("../src/data/monuments.json", import.meta.url),
      "utf8",
    ),
  );
  const heritage = JSON.parse(
    readFileSync(
      new URL("../src/data/generated/heritage.json", import.meta.url),
      "utf8",
    ),
  );
  const all = [...editorial, ...heritage, ...imports];
  assert.equal(imports.length, 791);
  for (const delta of [0.025, 0.01, 0.003]) {
    const groups = viewportGroups(
      all,
      { ...region, latitudeDelta: delta, longitudeDelta: delta },
      390,
      800,
    );
    const expected = all.filter(
      (p) =>
        Math.abs(p.latitude - region.latitude) <= delta * 0.6 &&
        Math.abs(p.longitude - region.longitude) <= delta * 0.6,
    );
    assert.ok(expected.length > 0);
    assert.equal(groups.length, expected.length);
    assert.ok(groups.every((g) => g.members.length === 1));
    assert.deepEqual(
      groups.flatMap((g) => g.members.map((p) => p.id)).sort(),
      expected.map((p) => p.id).sort(),
    );
  }
});
test("explicit individual mode has zero counters even at far zoom with hundreds of imports", () => {
  const imports = JSON.parse(
    readFileSync(
      new URL("../src/data/imported-pois.json", import.meta.url),
      "utf8",
    ),
  );
  const groups = viewportGroups(
    imports,
    {
      latitude: 45.65,
      longitude: 4.85,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    },
    390,
    800,
    "individual",
  );
  assert.ok(groups.length > 500);
  assert.ok(groups.every((g) => g.members.length === 1));
});

test("Explorer starts with individual POIs and map taps use the co-location-aware selector", () => {
  const explorer = readFileSync(
    new URL("../src/app/(tabs)/index.tsx", import.meta.url),
    "utf8",
  );
  assert.match(explorer, /useState<PoiGroupingMode>\("individual"\)/);
  assert.match(explorer, /onSelect=\{selectMapMonument\}/);
  assert.match(explorer, /coincidentPois\(monument, visibleMonuments\)/);
  assert.match(explorer, /selectMonument\(m\)/);
});
