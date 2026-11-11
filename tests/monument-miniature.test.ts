import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { miniaturePlan, miniatureView } from "../src/lib/miniatures/policy.ts";
const require = createRequire(import.meta.url),
  root = new URL("../", import.meta.url);
const temple = { id: "auguste", latitude: 45.5255, longitude: 4.8742 };
const region = { ...temple, latitudeDelta: 0.004, longitudeDelta: 0.004 };
test("miniature is temple-only, close-zoom bounded and respects display opt-out", () => {
  assert.deepEqual(miniaturePlan("auguste", [temple], region, 844), {
    enabled: true,
    size: 128,
  });
  assert.equal(
    miniaturePlan("auguste", [temple], { ...region, latitudeDelta: 0.03 }, 844)
      .enabled,
    false,
  );
  assert.equal(
    miniaturePlan("auguste", [temple], region, 844, false).enabled,
    false,
  );
  assert.equal(miniaturePlan("cybele", [temple], region, 844).enabled, false);
  assert.equal(miniaturePlan("auguste", [], region, 844).enabled, false);
  assert.equal(
    miniaturePlan("auguste", [temple], { ...region, latitudeDelta: NaN }, 844)
      .enabled,
    false,
  );
});
test("nearby monuments reduce the illustration size without removing or moving any POI", () => {
  const points = [
    temple,
    { ...temple, id: "nearby", latitude: temple.latitude + 0.0001 },
  ];
  const snapshot = JSON.stringify(points);
  assert.deepEqual(miniaturePlan("auguste", points, region, 844), {
    enabled: true,
    size: 96,
  });
  assert.equal(JSON.stringify(points), snapshot);
  for (const span of [0.008, 0.004, 0.001])
    assert.ok(
      miniaturePlan("auguste", points, { ...region, latitudeDelta: span }, 844)
        .size <= 128,
    );
});
test("camera headings quantize to eight views and wrap continuously around north", () => {
  for (let i = 0; i < 8; i++) assert.equal(miniatureView(i * 45), i);
  assert.equal(miniatureView(359), 0);
  assert.equal(miniatureView(-45), 7);
  assert.equal(miniatureView(NaN), 0);
  assert.equal(miniatureView(720), 0);
});
test("eight local renders have transparent pixels and retina variants with a reusable source model", () => {
  const { inspectPng } = require("../scripts/poi/png-inspect.cjs");
  for (let i = 0; i < 8; i++)
    for (const density of [1, 2, 3]) {
      const f = new URL(
        `assets/monuments/miniatures/auguste/view-${i}${density === 1 ? "" : `@${density}x`}.png`,
        root,
      );
      const b = readFileSync(f);
      assert.equal(b.readUInt32BE(16), 128 * density);
      assert.equal(b.readUInt32BE(20), 128 * density);
      const info = inspectPng(b);
      assert.ok(info.transparent > 0);
      assert.ok(info.opaque > 0);
    }
  for (const f of [
    "temple-miniature-source.blend",
    "temple-miniature-source.glb",
    "preview.png",
  ])
    assert.ok(
      existsSync(new URL("assets/monuments/miniatures/auguste/" + f, root)),
    );
});
test("actual map marker preserves canonical coordinates, status and temple click, with a missing-pack fallback", () => {
  const code = ts.transpileModule(
    readFileSync(
      new URL("src/components/exploration/MonumentMiniatureMarker.tsx", root),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const ex: any = {},
    captures: any[] = [];
  let chosen: any,
    pack: any = { views: [1, 2, 3, 4, 5, 6, 7, 8] };
  vm.runInNewContext(code, {
    exports: ex,
    require: (id: string) => {
      if (id === "react-native")
        return {
          Animated: {
            Value: class {},
            View: (p: any) => React.createElement("div", null, p.children),
          },
          View: (p: any) => React.createElement("div", null, p.children),
          Text: (p: any) => React.createElement("span", null, p.children),
          Image: () => null,
        };
      if (id === "react-native-maps")
        return {
          Marker: (p: any) => {
            captures.push(p);
            return React.createElement("div", null, p.children);
          },
        };
      if (id === "../../lib/miniatures/assets")
        return { miniatureFor: () => pack };
      if (id === "../../lib/miniatures/policy") return { miniatureView };
      if (id === "../../lib/poi")
        return {
          poiStatus: () => "editorial_unreviewed",
          statusColors: { editorial_unreviewed: "#888" },
          statusLabels: { editorial_unreviewed: "Éditorial non vérifié" },
        };
      if (id === "./IllustratedPoiMarker")
        return {
          IllustratedPoiMarker: () =>
            React.createElement("span", null, "gold-fallback"),
        };
      return require(id);
    },
  });
  const props = {
    monument: temple,
    state: "undiscovered",
    selected: false,
    plan: { enabled: true, size: 128 },
    mapHeading: 0,
    reducedMotion: true,
    onSelect() {},
    onOpenMiniature: (m: any) => (chosen = m),
  };
  const html = renderToStaticMarkup(
    React.createElement(ex.MonumentMiniatureMarker, props),
  );
  assert.ok(html.includes("Non vérifié"));
  assert.ok(!html.includes("Vérifié rédaction"));
  assert.equal(captures[0].coordinate.latitude, temple.latitude);
  assert.equal(captures[0].coordinate.longitude, temple.longitude);
  let stopped = false;
  captures[0].onPress({ stopPropagation: () => (stopped = true) });
  assert.equal(chosen, temple);
  assert.equal(stopped, true);
  assert.ok(captures[0].zIndex < 100);
  pack = undefined;
  assert.ok(
    renderToStaticMarkup(
      React.createElement(ex.MonumentMiniatureMarker, props),
    ).includes("gold-fallback"),
  );
});
