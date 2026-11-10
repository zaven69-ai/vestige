import { test } from "node:test";
import assert from "node:assert/strict";
import { catiaPreviewExport } from "../src/lib/avatars/catiaModule.ts";

test("Catia loader resolves named and default Metro exports to a component", () => {
  const component = () => null;
  assert.equal(catiaPreviewExport({ Catia3DPreview: component }), component);
  assert.equal(catiaPreviewExport({ default: component }), component);
  assert.equal(catiaPreviewExport({ Catia3DPreview: component, default: undefined }), component);
});

test("missing, async and invalid exports fail explicitly before React renders", () => {
  for (const module of [undefined, null, {}, { default: undefined }, { default: {} },
    { default: Promise.resolve(undefined) }, Promise.resolve({ default: () => null })]) {
    assert.throws(() => catiaPreviewExport(module), /Catia module/);
  }
});

// Execute the real loader after TSX compilation. Only its native renderer is
// substituted: this checks the import boundary, not Expo GL on a device.
import ts from "typescript";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const nodeRequire = createRequire(import.meta.url);
function loaderFixture(renderer: () => unknown) {
  const source = readFileSync(new URL("../src/components/avatars/Catia3DPreviewLoader.tsx", import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports: { Catia3DPreviewLoader?: () => ReturnType<typeof createElement> } = {};
  let loads = 0;
  vm.runInNewContext(code, { exports, require: (id: string) => {
    if (id === "./Catia3DPreview") { loads++; return renderer(); }
    if (id === "../../lib/avatars/catiaModule") return { catiaPreviewExport };
    return nodeRequire(id);
  } });
  return { Component: exports.Catia3DPreviewLoader!, loads: () => loads };
}

test("real loader defers the native module until render and renders a named component", () => {
  const fixture = loaderFixture(() => ({ Catia3DPreview: () => createElement("span", null, "Catia 3D") }));
  assert.equal(fixture.loads(), 0, "loading the wrapper must leave image mode independent of Expo GL");
  assert.match(renderToString(createElement(fixture.Component)), /Catia 3D/);
  assert.equal(fixture.loads(), 1);
});

test("real loader propagates native evaluation failures and rejects undefined components", () => {
  const error = new Error("ExpoGL unavailable");
  const failed = loaderFixture(() => { throw error; });
  assert.throws(() => renderToString(createElement(failed.Component)), (actual) => actual === error);
  const missing = loaderFixture(() => ({ default: undefined }));
  assert.throws(() => renderToString(createElement(missing.Component)), /Catia module/);
});
