import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { miniaturePlan } from "../src/lib/miniatures/policy.ts";
const root = new URL("../", import.meta.url),
  require = createRequire(import.meta.url);
const load = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
test("Lyon demo presets reuse canonical POIs and do not add street or duplicate monument entries", () => {
  const catalogue = [
    ...load("src/data/monuments.json"),
    ...load("src/data/imported-pois.json"),
  ];
  const ex: any = {};
  const code = ts.transpileModule(
    readFileSync(new URL("src/data/lyonDemo.ts", root), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  vm.runInNewContext(code, {
    exports: ex,
    require: () => ({
      monuments: catalogue,
      cities: { Lyon: { latitude: 45.7602, longitude: 4.826 } },
    }),
  });
  assert.equal(ex.DEMO_CITY, "Lyon");
  assert.equal(ex.lyonDemoPresets.length, 6);
  for (const id of [
    "fourviere",
    "theatre-lyon",
    "saint-jean",
    "osm-way-55071957",
  ])
    assert.ok(
      ex.lyonDemoPresets.some(
        (p: any) => p.point === catalogue.find((m) => m.id === id),
      ),
    );
  const street = ex.lyonDemoPresets.at(-1).point;
  assert.equal(street.latitude, 45.762486);
  assert.equal(street.longitude, 4.832794);
  assert.equal(catalogue.filter((m) => m.id === "fourviere").length, 1);
});
test("both Lyon miniature packs have complete transparent retina families and source models", () => {
  const { inspectPng } = require("../scripts/poi/png-inspect.cjs");
  for (const id of ["fourviere", "theatre-lyon"]) {
    for (let view = 0; view < 8; view++)
      for (const density of [1, 2, 3]) {
        const data = readFileSync(
          new URL(
            `assets/monuments/miniatures/${id}/view-${view}${density === 1 ? "" : `@${density}x`}.png`,
            root,
          ),
        );
        assert.equal(data.readUInt32BE(16), 128 * density);
        const info = inspectPng(data);
        assert.ok(info.transparent > 0 && info.opaque > 0);
      }
    assert.equal(
      readFileSync(
        new URL(`assets/monuments/miniatures/${id}/miniature-source.glb`, root),
      ).toString("utf8", 0, 4),
      "glTF",
    );
    const p = load("src/data/monuments.json").find((m: any) => m.id === id);
    assert.equal(
      miniaturePlan(
        id,
        [p],
        { ...p, latitudeDelta: 0.003, longitudeDelta: 0.003 },
        844,
        true,
        ["auguste", "fourviere", "theatre-lyon"],
      ).enabled,
      true,
    );
  }
});
test("Lyon camera and city preference never write a fabricated GPS position; Vienne remains accessible", () => {
  const source = (p: string) => readFileSync(new URL(p, root), "utf8");
  assert.match(
    source("src/app/(tabs)/index.tsx"),
    /explorationCamera\(cities.Lyon, true\)/,
  );
  assert.match(source("src/app/(tabs)/index.tsx"), /if \(!fresh\)/);
  const prefs = source("src/hooks/useMapCityPreference.ts");
  assert.match(prefs, /vestige.map.city.v1/);
  assert.doesNotMatch(prefs, /setFix|discover|recordDiscovery/);
  assert.match(
    source("src/components/developer/DeveloperControls.tsx"),
    /Centre de Vienne/,
  );
  assert.match(
    source("src/lib/live/LiveProvider.tsx"),
    /initialTourId \?\? "trail-lyon"/,
  );
});
