import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { playableAdventure, type Adventure } from "../src/lib/adventures.ts";
import {
  startVisit,
  advanceVisit,
  restoreVisit,
} from "../src/lib/live/session.ts";
import type { LiveTour } from "../src/lib/live/types.ts";
const root = new URL("../", import.meta.url),
  require = createRequire(import.meta.url);
const adventures = JSON.parse(
  readFileSync(new URL("src/data/adventures/lyon.json", root), "utf8"),
) as Adventure[];
const catalogue = [
  ...JSON.parse(readFileSync(new URL("src/data/monuments.json", root), "utf8")),
  ...JSON.parse(
    readFileSync(new URL("src/data/imported-pois.json", root), "utf8"),
  ),
];
test("six themes exist but only two documented adventures can start", () => {
  assert.equal(adventures.length, 6);
  assert.equal(new Set(adventures.map((a) => a.id)).size, 6);
  const pub = adventures.filter(playableAdventure);
  assert.deepEqual(
    pub.map((a) => a.id),
    ["lyon-lugdunum", "lyon-medieval"],
  );
  for (const a of adventures.filter((a) => !playableAdventure(a)))
    assert.equal(a.steps.length, 0);
  for (const a of pub) {
    assert.equal(a.steps.length, 3);
    for (const s of a.steps) {
      assert.ok(catalogue.some((m: any) => m.id === s.poiId));
      assert.equal(s.status, "documented");
      assert.ok(s.sources.length && s.checkedAt);
    }
  }
});
test("draft, UGC or unreviewed steps cannot be promoted by a published flag", () => {
  const a = adventures.find(playableAdventure)!;
  assert.equal(playableAdventure({ ...a, publication: "draft" }), false);
  assert.equal(playableAdventure({ ...a, origin: "community" }), false);
  assert.equal(
    playableAdventure({
      ...a,
      steps: a.steps.map((s) => ({ ...s, status: "unreviewed" })),
    }),
    false,
  );
  assert.equal(playableAdventure({ ...a, steps: [] }), false);
});
test("new tour checkpoints advance through all three existing POIs and restore without touching XP", () => {
  for (const a of adventures.filter(playableAdventure)) {
    const t: LiveTour = {
      id: a.id,
      title: a.title,
      subtitle: a.summary,
      stops: a.steps.map((s) => ({
        ...s,
        storyId: "",
        sourceUrl: s.sources[0],
      })),
    };
    let state = startVisit(t, 1);
    for (let i = 0; i < 3; i++) {
      state = advanceVisit(state, t, "consulted", 10 + i);
      assert.deepEqual(restoreVisit(JSON.stringify(state), t), state);
    }
    assert.ok(state.endedAt);
    assert.equal(Object.keys(state.outcomes).length, 3);
    assert.ok(!("xp" in state));
  }
});
test("real AdventureCard exposes only published start and navigates to Explorer after begin", () => {
  for (const adventure of [
    adventures[0],
    adventures.find(playableAdventure)!,
  ]) {
    const ex: any = {},
      buttons: any[] = [],
      events: any[] = [];
    const code = ts.transpileModule(
      readFileSync(
        new URL("src/components/live/AdventureCard.tsx", root),
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
    vm.runInNewContext(code, {
      exports: ex,
      require: (id: string) => {
        if (id === "react-native")
          return {
            View: (p: any) => React.createElement("div", null, p.children),
            Text: (p: any) => React.createElement("span", null, p.children),
            Linking: {},
            Alert: {},
          };
        if (id === "expo-router")
          return { router: { navigate: (p: any) => events.push(p) } };
        if (id === "../../lib/adventures") return { playableAdventure };
        if (id === "../../data/monuments") return { monuments: catalogue };
        if (id === "../../lib/live/LiveProvider")
          return {
            useLive: () => ({
              ready: true,
              session: null,
              savedVisit: () => null,
              begin: (id: string) => events.push(id),
            }),
          };
        if (id === "../ui")
          return {
            s: {},
            Badge: (p: any) => React.createElement("span", null, p.children),
            Button: (p: any) => {
              buttons.push(p);
              return React.createElement("button", null, p.title);
            },
          };
        return require(id);
      },
    });
    renderToStaticMarkup(
      React.createElement(ex.AdventureCard, { adventure, index: 0 }),
    );
    const button = buttons.find(
      (b) => b.title === "Commencer" || b.title === "Bientôt",
    );
    assert.equal(button.disabled, !playableAdventure(adventure));
    button.onPress();
    if (playableAdventure(adventure)) {
      assert.equal(events[0], adventure.id);
      assert.equal(events[1].pathname, "/(tabs)");
    } else assert.equal(events.length, 0);
  }
});

test("actual step footer requires GPS arrival for real validation, while simulation remains ephemeral", () => {
  const ex: any = {},
    buttons: any[] = [];
  const code = ts.transpileModule(
    readFileSync(
      new URL("src/components/navigation/GuidedVisitFooter.tsx", root),
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
  vm.runInNewContext(code, {
    exports: ex,
    __DEV__: true,
    require: (id: string) => {
      if (id === "react-native")
        return {
          View: (p: any) => React.createElement("div", null, p.children),
          Text: (p: any) => React.createElement("span", null, p.children),
          ScrollView: (p: any) => React.createElement("div", null, p.children),
        };
      if (id === "../ui")
        return {
          s: {},
          Button: (p: any) => {
            buttons.push(p);
            return React.createElement("button", null, p.title);
          },
        };
      if (id === "../../lib/live/eligibility")
        return { playableAsset: () => null };
      if (id === "../../data/live/vienneAntique") return { liveAssets: {} };
      return require(id);
    },
  });
  for (const preview of [false, true])
    for (const arrived of [false, true]) {
      buttons.length = 0;
      renderToStaticMarkup(
        React.createElement(ex.GuidedVisitFooter, {
          guide: {
            stop: {},
            story: undefined,
            session: { index: 0, paused: false },
            tour: { title: "Test", stops: [1, 2, 3], presenceRequired: true },
            navigation: { arrived },
            live: { preview },
          },
          onNext() {},
        }),
      );
      assert.equal(
        buttons.find((b) => b.title === "Étape suivante").disabled,
        !preview && !arrived,
      );
    }
});
