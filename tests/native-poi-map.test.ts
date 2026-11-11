import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as poi from "../src/lib/poi.ts";
import {
  nativePoiMode,
  nativePoiModes,
  POI_MARKER_SIZE,
} from "../src/lib/poiMapRendering.ts";
const nodeRequire = createRequire(import.meta.url),
  root = new URL("../", import.meta.url);
function evaluate(file: string, dependencies: (id: string) => unknown) {
  const exports: Record<string, any> = {};
  const code = ts.transpileModule(readFileSync(new URL(file, root), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(code, { exports, require: dependencies });
  return exports;
}
test("native renderer selects independent discovery/selection modes without changing review", () => {
  assert.equal(nativePoiMode("nearby", false), "nearby");
  assert.equal(nativePoiMode("nearby", true), "selected");
  assert.equal(nativePoiMode("discovered", false), "discovered");
  assert.equal(nativePoiMode("discovered", true), "discovered-selected");
  assert.equal(nativePoiMode("featured", false), "idle");
});
test("every native sprite has 1x, 2x and 3x local image assets at a bounded display size", () => {
  let families = 0;
  for (const category of poi.poiCategories)
    for (const status of poi.poiStatuses)
      for (const mode of nativePoiModes) {
        for (const scale of [1, 2, 3]) {
          const suffix = scale === 1 ? "" : `@${scale}x`,
            file = new URL(
              `assets/poi/map-native/${category}-${status}-${mode}${suffix}.png`,
              root,
            );
          assert.ok(existsSync(file), String(file));
          const data = readFileSync(file);
          assert.equal(data.readUInt32BE(16), POI_MARKER_SIZE.width * scale);
          assert.equal(data.readUInt32BE(20), POI_MARKER_SIZE.height * scale);
        }
        families++;
      }
  assert.equal(families, 210);
});
for (const platform of ["ios", "android"])
  test(`actual ${platform} marker loads its PNG and dispatches the monument press`, () => {
    const assets = evaluate("src/components/poi/nativeMapAssets.ts", (id) =>
      id.endsWith(".png")
        ? id
        : id === "../../lib/poiMapRendering"
          ? { nativePoiMode }
          : nodeRequire(id),
    );
    let captured: any, loadedImage: any, selected: any;
    const loaded = evaluate(
      "src/components/exploration/IllustratedPoiMarker.tsx",
      (id) => {
        if (id === "react-native")
          return {
            Platform: { OS: platform },
            Image: (props: any) => {
              loadedImage = props;
              return null;
            },
          };
        if (id === "react-native-maps")
          return {
            Marker: (props: any) => {
              captured = props;
              return props.children;
            },
          };
        if (id === "../../lib/poi") return poi;
        if (id === "../../lib/poiMapRendering") return { POI_MARKER_SIZE };
        if (id === "../poi/nativeMapAssets") return assets;
        return nodeRequire(id);
      },
    );
    const monument = {
      id: "fixture",
      name: "Temple",
      latitude: 45,
      longitude: 4,
      category: "Monument antique",
      origin: "import",
      reviewStatus: "unreviewed",
    };
    renderToStaticMarkup(
      React.createElement(loaded.IllustratedPoiMarker, {
        monument,
        state: "discovered",
        selected: true,
        reducedMotion: false,
        onSelect: (m: any) => {
          selected = m;
        },
      }),
    );
    if (platform === "ios") {
      assert.equal(captured.image, undefined);
      assert.match(
        loadedImage.source,
        /temple-imported_unreviewed-discovered-selected\.png$/,
      );
      assert.equal(loadedImage.style.width, 64);
      assert.equal(loadedImage.style.height, 72);
      assert.equal(typeof loadedImage.onLoad, "function");
      assert.equal(
        captured.tracksViewChanges,
        true,
        "do not freeze the view before PNG load",
      );
      assert.equal(loadedImage.pointerEvents, "none");
    } else {
      assert.match(
        captured.image,
        /temple-imported_unreviewed-discovered-selected\.png$/,
      );
      assert.equal(captured.children, null);
      assert.equal(captured.tracksViewChanges, false);
    }
    assert.equal(captured.tappable, true);
    assert.match(captured.accessibilityLabel, /Importé · non vérifié/);
    let stopped = false;
    captured.onPress({
      stopPropagation() {
        stopped = true;
      },
    });
    assert.equal(stopped, true);
    assert.equal(selected, monument);
  });
test("Explorer mounts the native illustrated component, not only a preview or the old pictogram component", () => {
  const source = ts.createSourceFile(
    "index.tsx",
    readFileSync(new URL("src/app/(tabs)/index.tsx", root), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const rendered: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && ts.isIdentifier(node.tagName))
      rendered.push(node.tagName.text);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(rendered.includes("IllustratedPoiMarker"));
  assert.ok(rendered.includes("PoiClusterMarker"));
  assert.ok(!rendered.includes("HistoricalMarker"));
});
