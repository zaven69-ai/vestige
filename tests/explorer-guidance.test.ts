import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  authoritativeNavigationFix,
  realPosition,
} from "../src/lib/navigation/position.ts";
import {
  partitionGuidedPois,
  canPresentArrival,
} from "../src/lib/navigation/explorer.ts";
import {
  checkpoint,
  emptyCheckpoints,
  readCheckpoints,
  restoreTourState,
  LIVE_CHECKPOINTS_KEY,
} from "../src/lib/live/checkpoints.ts";
import {
  startVisit,
  advanceVisit,
  LIVE_SESSION_KEY,
} from "../src/lib/live/session.ts";
import type { LiveTour } from "../src/lib/live/types.ts";
const root = new URL("../", import.meta.url),
  load = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const first: LiveTour = {
  id: "vienne-antique-v1",
  title: "Vienne antique",
  subtitle: "",
  stops: ["auguste", "cybele", "theatre-vienne"].map((poiId) => ({
    poiId,
    storyId: "",
    approach: { latitude: 45, longitude: 4 },
    access: "",
    sourceUrl: "https://example.org",
    checkedAt: "",
  })),
};
const second: LiveTour = {
  ...first,
  id: "trail-lyon",
  title: "Lugdunum",
  stops: first.stops.slice(0, 2),
};
test("GPS simulation boundary cannot supply authoritative routing or arrival coordinates", () => {
  const fix = {
    latitude: 45.525,
    longitude: 4.875,
    accuracy: 5,
    timestamp: 100000,
  };
  assert.equal(authoritativeNavigationFix(realPosition(fix)), fix);
  assert.equal(
    authoritativeNavigationFix({ source: "developer-preview", fix }),
    null,
  );
  assert.equal(authoritativeNavigationFix(realPosition(null)), null);
});
test("guided POIs remain selectable despite filters, appear once and do not remove ordinary POIs", () => {
  const points = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  const partition = partitionGuidedPois(
    points,
    new Set(["b", "c"]),
    (p) => p.id === "a",
  );
  assert.deepEqual(
    partition.route.map((p) => p.id),
    ["b", "c"],
  );
  assert.deepEqual(
    partition.ordinary.map((p) => p.id),
    ["a"],
  );
  assert.equal(
    new Set([...partition.route, ...partition.ordinary].map((p) => p.id)).size,
    3,
  );
  assert.deepEqual(
    partition.visible.map((p) => p.id),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    partitionGuidedPois(points, new Set(), () => true).ordinary,
    points,
  );
});
test("arrival sheet opens once per step only on the active focused map, deferring while blocked", () => {
  const input = {
    stageKey: "session:tour:0",
    seen: new Set<string>(),
    active: true,
    focused: true,
    arrived: true,
    blocked: false,
  };
  assert.equal(canPresentArrival(input), true);
  for (const change of [
    { focused: false },
    { active: false },
    { arrived: false },
    { blocked: true },
  ])
    assert.equal(canPresentArrival({ ...input, ...change }), false);
  input.seen.add(input.stageKey);
  assert.equal(canPresentArrival(input), false);
  assert.equal(
    canPresentArrival({ ...input, stageKey: "session:tour:1" }),
    true,
  );
});
test("per-tour checkpoints migrate the old active visit and preserve progress when switching routes", () => {
  const old = advanceVisit(startVisit(first, 100), first, "consulted", 101);
  const migrated = restoreTourState(null, JSON.stringify(old), [first, second]);
  assert.deepEqual(migrated.session, old);
  assert.deepEqual(migrated.store.sessions[first.id], old);
  const other = advanceVisit(startVisit(second, 102), second, "skipped", 103),
    store = checkpoint(migrated.store, other);
  assert.equal(store.activeTourId, second.id);
  assert.deepEqual(store.sessions[first.id], old);
  const restored = restoreTourState(
    JSON.stringify(store),
    JSON.stringify(old),
    [first, second],
  );
  assert.deepEqual(restored.session, other);
  assert.notEqual(LIVE_CHECKPOINTS_KEY, LIVE_SESSION_KEY);
  assert.equal("xp" in restored.store, false);
  assert.deepEqual(readCheckpoints(null, [first]), emptyCheckpoints());
});
test("unknown or corrupt checkpoints are rejected without silently replacing the legacy visit", () => {
  for (const raw of [
    "bad",
    "{}",
    JSON.stringify({ version: 1, activeTourId: "unknown", sessions: {} }),
    JSON.stringify({
      version: 1,
      activeTourId: null,
      sessions: { unknown: startVisit(first, 100) },
    }),
  ])
    assert.throws(() =>
      restoreTourState(raw, JSON.stringify(startVisit(first, 100)), [
        first,
        second,
      ]),
    );
});
test("real catalog button starts its selected tour and navigates directly to Explorer", () => {
  const source = readFileSync(
      new URL("src/components/live/TourCard.tsx", root),
      "utf8",
    ),
    code = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
  const require = createRequire(import.meta.url),
    buttons: any[] = [],
    events: any[] = [];
  const records = [
    ...load("src/data/monuments.json"),
    ...load("src/data/generated/heritage.json"),
  ];
  const exports: any = {};
  const passthrough = ({ children }: any) =>
    React.createElement(React.Fragment, null, children);
  vm.runInNewContext(code, {
    exports,
    Date,
    require: (id: string) => {
      if (id === "react-native")
        return { Text: passthrough, View: passthrough };
      if (id === "expo-router")
        return {
          router: { navigate: (href: any) => events.push(["navigate", href]) },
        };
      if (id === "../../lib/live/LiveProvider")
        return {
          useLive: () => ({
            session: null,
            savedVisit: () => null,
            ready: true,
            storageError: null,
            begin: (id: string) => events.push(["begin", id]),
          }),
        };
      if (id === "../../lib/store") return { useGame: () => ({ journal: {} }) };
      if (id === "../../data/live/vienneAntique")
        return { vienneAntique: first, liveStories: [] };
      if (id === "../../data/monuments") return { monuments: records };
      if (id === "../MonumentPhoto") return { MonumentPhoto: () => null };
      if (id === "../ui")
        return {
          Badge: passthrough,
          Button: (props: any) => {
            buttons.push(props);
            return null;
          },
          ProgressBar: () => null,
          s: { card: {}, body: {}, heading: {}, caption: {} },
        };
      return require(id);
    },
  });
  renderToStaticMarkup(React.createElement(exports.TourCard, { tour: first }));
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].title, "Commencer");
  buttons[0].onPress();
  assert.deepEqual(events[0], ["begin", first.id]);
  assert.equal(events[1][1].pathname, "/(tabs)");
  assert.equal(events[1][1].params.guide, "start");
});
test("Explorer owns the guidance map; the existing contribution pin-picker is preserved", () => {
  const explorer = readFileSync(
    new URL("src/app/(tabs)/index.tsx", root),
    "utf8",
  );
  assert.match(explorer, /useExplorerGuidance\(focused, location.position\)/);
  assert.match(explorer, /<Polyline/);
  assert.match(explorer, /<ExplorerGuideHUD/);
  assert.match(explorer, /<GuidedVisitFooter/);
  assert.match(explorer, /canPresentArrival/);
  for (const file of [
    "src/app/(tabs)/parcours.tsx",
    "src/app/visite-vienne.tsx",
    "src/components/live/VisitMap.tsx",
  ])
    assert.doesNotMatch(
      readFileSync(new URL(file, root), "utf8"),
      /<MapView|useWalkingNavigation/,
    );
  const old = readFileSync(new URL("src/app/visite-vienne.tsx", root), "utf8");
  assert.match(old, /<Redirect/);
  const locations: string[] = [];
  function walk(path: string) {
    for (const entry of readdirSync(new URL(path, root), {
      withFileTypes: true,
    })) {
      const name = path + "/" + entry.name;
      if (entry.isDirectory()) walk(name);
      else if (
        name.endsWith(".tsx") &&
        /<MapView\b/.test(readFileSync(new URL(name, root), "utf8"))
      )
        locations.push(name);
    }
  }
  walk("src");
  assert.deepEqual(locations, [
    "src/app/(tabs)/index.tsx",
    "src/app/contribuer.tsx",
  ]);
});

test("leaving guidance clears only the active pointer and keeps the unfinished checkpoint resumable", () => {
  const session = advanceVisit(startVisit(first, 100), first, "consulted", 101);
  const cache = {
    ...checkpoint(emptyCheckpoints(), session),
    activeTourId: null,
  };
  const restored = restoreTourState(
    JSON.stringify(cache),
    JSON.stringify(session),
    [first, second],
  );
  assert.equal(restored.session, null);
  assert.deepEqual(restored.store.sessions[first.id], session);
  assert.equal(restored.store.sessions[first.id].endedAt, null);
});
