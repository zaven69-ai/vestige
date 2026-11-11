// @ts-ignore Existing dependency-free PNG asset validator.
import { validateRgbaPng } from "../scripts/avatars/register-pack.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  catiaMapSpec,
  catiaMovement,
  readMapPlayer,
  CATIA_MAP_KEY,
} from "../src/lib/avatars/catiaMap.ts";
import { avatarFacing } from "../src/lib/avatar.ts";
const root = new URL("../", import.meta.url);
test("Catia defaults to the separately stored map choice and preserves the saved avatar option", () => {
  assert.equal(readMapPlayer(null), "catia");
  for (const choice of ["catia", "saved"])
    assert.equal(readMapPlayer(JSON.stringify({ version: 1, choice })), choice);
  assert.notEqual(CATIA_MAP_KEY, "vestige.avatar.preference.v1");
  for (const raw of [
    "bad",
    "[]",
    '{"version":2,"choice":"catia"}',
    '{"version":1,"choice":"alex"}',
  ])
    assert.throws(() => readMapPlayer(raw));
});
test("Catia idle, walk and run depend on valid fresh movement, never on preview coordinates", () => {
  const now = 100000;
  const before = {
    latitude: 45.525,
    longitude: 4.875,
    timestamp: now - 3000,
    accuracy: 3,
    speed: 0,
  };
  const moving = { ...before, latitude: 45.52505, timestamp: now, speed: 1.2 };
  assert.equal(catiaMovement(null, moving, now).phase, "idle");
  assert.equal(catiaMovement(before, moving, now).phase, "walk");
  assert.equal(
    catiaMovement(before, { ...moving, speed: 3 }, now).phase,
    "run",
  );
  for (const changed of [
    { ...moving, speed: 0 },
    { ...moving, speed: 20 },
    { ...moving, timestamp: now - 31000 },
    { ...moving, accuracy: 100 },
  ])
    assert.equal(catiaMovement(before, changed, now).phase, "idle");
  assert.ok(catiaMovement(before, moving, now).until > now);
});
test("Catia view angles compensate map rotation and have a known front fallback", () => {
  assert.equal(avatarFacing(90, 0), "e");
  assert.equal(avatarFacing(90, 90), "n");
  assert.equal(avatarFacing(null, 0), "unknown");
});
test("Catia sprites are traceable to the untouched corrected animated GLB and have full RGBA frames", () => {
  const report = JSON.parse(
    readFileSync(
      new URL("assets/avatars/catia/map-sprites/render-report.json", root),
      "utf8",
    ),
  );
  assert.equal(report.complete, true);
  assert.equal(report.frames.length, 208);
  const glb = readFileSync(new URL(report.source, root));
  assert.equal(
    createHash("sha256").update(glb).digest("hex"),
    report.sourceSha256,
  );
  assert.equal(
    report.sourceSha256,
    "3efe730d69dbc67cb6ca3fcc33d2767ab976a54686a345927fcf73d4fe8318a9",
  );
  for (const angle of ["n", "ne", "e", "se", "s", "sw", "w", "nw"])
    for (const phase of ["idle", "walk", "run"] as const) {
      const frames = report.frames.filter(
        (f: { facing: string; phase: string }) =>
          f.facing === angle && f.phase === phase,
      );
      assert.equal(frames.length, catiaMapSpec.frames[phase]);
      const hashes = new Set();
      for (const entry of frames) {
        const png = readFileSync(
          new URL(`assets/avatars/catia/map-sprites/${entry.file}`, root),
        );
        assert.equal(png.readUInt32BE(16), 192);
        assert.equal(png.readUInt32BE(20), 272);
        assert.equal(png[25], 6);
        validateRgbaPng(png, 192, 272);
        const hash = createHash("sha256").update(png).digest("hex");
        assert.equal(hash, entry.sha256);
        hashes.add(hash);
      }
      assert.ok(hashes.size > 1, `${angle} ${phase} is actually animated`);
    }
});
test("map preview has no GPS fix, discovery or XP writer and is labelled explicitly", () => {
  const source = readFileSync(
    new URL("src/components/exploration/CatiaMapPreview.tsx", root),
    "utf8",
  );
  assert.match(source, /aperçu sans position GPS/);
  assert.ok(!/useGame|discover\(|latitude:|longitude:/.test(source));
  const map = readFileSync(new URL("src/app/(tabs)/index.tsx", root), "utf8");
  assert.match(map, /!fresh \|\| catiaPreview/);
  assert.match(
    map,
    /character=\{location.enabled \? "catia" : mapPlayer.choice\}/,
  );
  assert.match(map, /simulated=\{location.enabled\}/);
  assert.match(map, /<CatiaMapPreview/);
  assert.match(map, /<MonumentMiniatureMarker/);
  assert.match(map, /onSelect=\{selectMapMonument\}/);
  const renderer = readFileSync(
    new URL("src/components/exploration/PlayerMarker.tsx", root),
    "utf8",
  );
  assert.match(renderer, /CatiaSprite/);
  assert.ok(!/@react-three|Canvas|GLView/.test(renderer));
});

test("actual PlayerMarker renders full-body Catia at GPS coordinates with map-relative facing", async () => {
  const [{ default: ts }, { default: vm }, React, { renderToStaticMarkup }] =
    await Promise.all([
      import("typescript"),
      import("node:vm"),
      import("react"),
      import("react-dom/server"),
    ]);
  const { createRequire } = await import("node:module");
  const nativeRequire = createRequire(import.meta.url);
  const source = readFileSync(
    new URL("src/components/exploration/PlayerMarker.tsx", root),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  let marker: any, sprite: any;
  const NativeMarker = (props: any) => {
    marker = props;
    return props.children;
  };
  const exports: any = {};
  vm.runInNewContext(code, {
    exports,
    require: (id: string) => {
      if (id === "react-native")
        return {
          Platform: { OS: "ios" },
          Animated: {
            Value: class {
              value: number;
              constructor(n: number) {
                this.value = n;
              }
            },
            createAnimatedComponent: () => NativeMarker,
          },
          Easing: { linear: () => 0 },
        };
      if (id === "react-native-maps") return { Marker: NativeMarker };
      if (id === "./CatiaSprite")
        return {
          CatiaSprite: (props: any) => {
            sprite = props;
            return null;
          },
        };
      if (id === "./avatar/useCatiaFrame")
        return { useCatiaMovement: () => "walk" };
      if (id === "../../lib/avatars/catiaMap") return { catiaMapSpec };
      if (id === "../../lib/avatars/preferences")
        return {
          useAvatarPreferences: () => ({
            pack: { sprites: { n: { idle: [1], walk: [1] } } },
            activeChoice: "legacy",
            packVersion: "test",
          }),
        };
      if (id === "../../lib/avatar")
        return {
          avatarFacing,
          avatarSpec: { width: 80, height: 104, anchor: { x: 0.5, y: 0.9 } },
        };
      if (id === "./avatar/useAvatarAssets")
        return { useAvatarAssets: () => false };
      if (id === "./avatar/useAvatarFrame")
        return { useAvatarFrame: () => ({ phase: "idle", frame: 0 }) };
      if (id === "../../lib/exploration") return { avatarMotion: () => "hold" };
      if (id === "../../theme") return { theme: { motion: { travel: 250 } } };
      return nativeRequire(id);
    },
  });
  const fix = {
    latitude: 45.525,
    longitude: 4.875,
    timestamp: 100000,
    accuracy: 4,
  };
  renderToStaticMarkup(
    React.createElement(exports.PlayerMarker, {
      fix,
      direction: 90,
      mapHeading: 90,
      active: true,
      reducedMotion: false,
      character: "catia",
      animate: true,
    }),
  );
  assert.equal(marker.coordinate.latitude.value, fix.latitude);
  assert.equal(marker.coordinate.longitude.value, fix.longitude);
  assert.equal(marker.image, undefined);
  assert.equal(marker.zIndex, 100);
  assert.equal(sprite.facing, "n");
  assert.equal(sprite.phase, "walk");
  assert.equal(sprite.active, true);
  assert.match(marker.accessibilityLabel, /Catia.*GPS réelle/);
});
