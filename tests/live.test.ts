import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  emptyFence,
  tickFence,
  liveGPS,
  usableLiveFix,
} from "../src/lib/live/geofence.ts";
import {
  editoriallyApproved,
  playableAsset,
  storyKey,
} from "../src/lib/live/eligibility.ts";
import {
  startVisit,
  advanceVisit,
  restoreVisit,
  restorePreferences,
  LIVE_SESSION_KEY,
  LIVE_PREFS_KEY,
} from "../src/lib/live/session.ts";
import {
  playbackAdmission,
  currentPlayback,
} from "../src/lib/live/playback.ts";
import type { LiveStory, LiveAsset, LiveTour } from "../src/lib/live/types.ts";
const load = (path: string) =>
  JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const drafts = load("src/data/live/stories.json") as LiveStory[];
const story: LiveStory = {
  ...drafts[0],
  status: "live_editorial_approved",
  approval: {
    version: 1,
    contentHash: drafts[0].contentHash,
    approvedText: drafts[0].script,
    approvedBy: "unit-test fixture — not a real approval",
    approvedAt: "2026-11-11",
    humanReview: true,
  },
  audioId: "fixture",
};
const asset: LiveAsset = {
  id: "fixture",
  storyId: story.id,
  scriptVersion: 1,
  contentHash: story.contentHash,
  sha256: "a".repeat(64),
  rightsHolder: "unit-test fixture",
  license: "test-only",
  module: 1,
};
const assets = { fixture: asset };
const tour: LiveTour = {
  id: "test",
  title: "test",
  subtitle: "",
  stops: ["auguste", "cybele", "theatre-vienne"].map((poiId) => ({
    poiId,
    storyId: poiId,
    approach: { latitude: 45, longitude: 4 },
    access: "",
    sourceUrl: "https://example.org",
    checkedAt: "2026-11-11",
  })),
};
const base = {
  target: { latitude: 45, longitude: 4 },
  now: 100000,
  fix: { latitude: 45, longitude: 4, accuracy: 5, timestamp: 100000, speed: 1 },
  active: true,
  foreground: true,
  automatic: true,
  eligible: true,
  busy: false,
  alreadyTriggered: false,
};
test("GPS engine requires five seconds and multiple fresh fixes before one trigger", () => {
  let state = emptyFence();
  let out = tickFence(state, base);
  assert.equal(out.play, false);
  state = out.state;
  out = tickFence(state, { ...base, now: 105000 });
  assert.equal(out.play, false, "one frozen fix cannot validate the dwell");
  out = tickFence(state, {
    ...base,
    now: 105000,
    fix: { ...base.fix, timestamp: 105000 },
  });
  assert.equal(out.play, true);
  assert.equal(
    tickFence(out.state, {
      ...base,
      now: 106000,
      fix: { ...base.fix, timestamp: 106000 },
    }).play,
    false,
  );
});
for (const flag of ["active", "foreground", "automatic", "eligible"] as const)
  test(`GPS engine never triggers when ${flag} is false`, () => {
    const state = {
      ...emptyFence(),
      insideSince: 90000,
      firstFixAt: 90000,
      lastFixAt: 99000,
    };
    assert.equal(tickFence(state, { ...base, [flag]: false }).play, false);
  });
test("GPS rejects stale, future, inaccurate, invalid, fast and missing positions", () => {
  for (const fix of [
    null,
    { ...base.fix, timestamp: 84000 },
    { ...base.fix, timestamp: 100001 },
    { ...base.fix, accuracy: 51 },
    { ...base.fix, accuracy: -1 },
    { ...base.fix, accuracy: null },
    { ...base.fix, speed: 12 },
    { ...base.fix, latitude: NaN },
  ])
    assert.equal(usableLiveFix(fix, base.now), false);
  assert.equal(usableLiveFix({ ...base.fix, accuracy: 50 }, base.now), true);
});
test("leaving the entry zone resets dwell, exit hysteresis and cooldown prevent immediate rearm", () => {
  const entered = tickFence(emptyFence(), base).state;
  const outside = { ...base.fix, latitude: 45.0012, timestamp: 101000 };
  const reset = tickFence(entered, {
    ...base,
    now: 101000,
    fix: outside,
  }).state;
  assert.equal(reset.insideSince, null);
  const fired = { ...entered, armed: false, cooldownUntil: 160000 };
  assert.equal(
    tickFence(fired, {
      ...base,
      now: 110000,
      fix: { ...outside, timestamp: 110000 },
    }).state.armed,
    false,
  );
  assert.equal(
    tickFence(fired, {
      ...base,
      now: 161000,
      fix: { ...outside, timestamp: 161000 },
    }).state.armed,
    true,
  );
  assert.equal(liveGPS.exitMeters - liveGPS.enterMeters, 30);
});
test("manual changes, busy playback, recorded triggers and bad accuracy stop automatic duplication", () => {
  const state = {
    ...emptyFence(),
    insideSince: 90000,
    firstFixAt: 90000,
    lastFixAt: 99000,
  };
  assert.equal(tickFence(state, { ...base, busy: true }).play, false);
  assert.equal(
    tickFence(state, { ...base, alreadyTriggered: true }).play,
    false,
  );
  const reset = tickFence(state, {
    ...base,
    fix: { ...base.fix, accuracy: 90 },
  }).state;
  assert.equal(reset.insideSince, null);
  assert.equal(
    tickFence(reset, {
      ...base,
      now: 101000,
      fix: { ...base.fix, timestamp: 101000 },
    }).play,
    false,
  );
});
test("out-of-order GPS fixes reset entry instead of inventing a dwell", () => {
  const state = {
    ...emptyFence(),
    insideSince: 90000,
    firstFixAt: 90000,
    lastFixAt: 101000,
  };
  assert.equal(tickFence(state, base).state.insideSince, null);
});
test("only explicit human approval of exactly the current script version enables eligibility", () => {
  assert.equal(editoriallyApproved(story), true);
  assert.equal(playableAsset(story, assets), asset);
  for (const changed of [
    { ...story, script: story.script + " modifié" },
    { ...story, version: 2 },
    { ...story, approval: null },
    { ...story, status: "historically_verified" as const },
    { ...story, origin: "community" as const },
    { ...story, origin: "osm" as const },
  ])
    assert.equal(editoriallyApproved(changed), false);
  for (const draft of drafts) assert.equal(playableAsset(draft, assets), null);
  assert.notEqual(storyKey(story), storyKey({ ...story, version: 2 }));
});
test("audio is blocked if a recording is absent, wrong-version or lacks rights", () => {
  assert.equal(playableAsset(story, {}), null);
  for (const changed of [
    { ...asset, scriptVersion: 2 },
    { ...asset, contentHash: "bad" },
    { ...asset, license: "" },
    { ...asset, sha256: "bad" },
    { ...asset, rightsHolder: "" },
  ])
    assert.equal(playableAsset(story, { fixture: changed }), null);
});
test("playback admission serializes audio and respects manual mode and foreground", () => {
  const input = {
    active: true,
    paused: false,
    foreground: true,
    visible: true,
    mode: "manual" as const,
    automatic: false,
    busy: false,
    story,
    assets,
  };
  assert.equal(playbackAdmission(input), "allowed");
  assert.equal(playbackAdmission({ ...input, automatic: true }), "manual-mode");
  assert.equal(playbackAdmission({ ...input, busy: true }), "busy");
  for (const change of [
    { paused: true },
    { foreground: false },
    { visible: false },
    { active: false },
  ])
    assert.equal(playbackAdmission({ ...input, ...change }), "inactive");
  assert.equal(
    playbackAdmission({ ...input, story: drafts[0] }),
    "unavailable",
  );
  assert.equal(currentPlayback(null, 1), false);
  assert.equal(currentPlayback({ token: 2 }, 1), false);
  assert.equal(currentPlayback({ token: 2 }, 2), true);
});
test("visit progression survives restore, keeps skipped separate from listened and never contains XP", () => {
  let session = startVisit(tour, 100);
  session = advanceVisit(session, tour, "consulted", 101);
  session = advanceVisit(session, tour, "skipped", 102);
  assert.deepEqual(restoreVisit(JSON.stringify(session), tour), session);
  assert.equal(session.index, 2);
  assert.equal(session.outcomes.cybele, "skipped");
  session = advanceVisit(session, tour, "listened", 103);
  assert.equal(session.endedAt, 103);
  assert.equal("xp" in session, false);
  assert.equal(advanceVisit(session, tour, "listened", 104), session);
  assert.notEqual(LIVE_SESSION_KEY, "vestige.journal.v1");
  assert.notEqual(LIVE_PREFS_KEY, LIVE_SESSION_KEY);
});
test("corrupt visit/preference data is rejected without silent reset or loss", () => {
  assert.equal(restoreVisit(null, tour), null);
  assert.deepEqual(restorePreferences(null), {
    preferredMode: "manual",
    volume: 1,
  });
  for (const raw of [
    "bad",
    "{}",
    JSON.stringify({ ...startVisit(tour, 1), index: 5 }),
    JSON.stringify({ ...startVisit(tour, 1), index: 3 }),
    JSON.stringify({ ...startVisit(tour, 1), outcomes: 42 }),
  ])
    assert.throws(() => restoreVisit(raw, tour));
  assert.throws(() =>
    restorePreferences('{"version":1,"preferredMode":"bad","volume":2}'),
  );
  assert.equal(
    restorePreferences('{"version":1,"preferredMode":"automatic","volume":0.5}')
      .preferredMode,
    "automatic",
  );
});
test("pilot references existing monuments, has source dates and 30–60 second draft scripts without fake audio", () => {
  const ids = new Set(
    [
      ...load("src/data/monuments.json"),
      ...load("src/data/generated/heritage.json"),
    ].map((p) => p.id),
  );
  assert.equal(drafts.length, 3);
  for (const draft of drafts) {
    assert.ok(ids.has(draft.poiId));
    assert.equal(draft.status, "draft");
    assert.equal(draft.audioId, null);
    assert.equal(draft.approval, null);
    assert.equal(
      createHash("sha256").update(draft.script).digest("hex"),
      draft.contentHash,
    );
    const estimated = (draft.script.split(/\s+/).length / 150) * 60;
    assert.ok(estimated >= 30 && estimated <= 60);
    assert.ok(
      draft.sources.every(
        (s) =>
          s.url.startsWith("https://") &&
          s.consultedAt === "2026-11-11" &&
          s.publisher,
      ),
    );
  }
  assert.deepEqual(load("src/data/live/audio-manifest.json"), []);
});

test("real Expo Audio adapter waits for load, pauses, reports interruption and handles one end event", async () => {
  const [{ default: ts }, { default: vm }] = await Promise.all([
    import("typescript"),
    import("node:vm"),
  ]);
  const source = readFileSync(
    new URL("../src/components/live/NativeNarration.tsx", import.meta.url),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  async function run(playing: boolean, isLoaded: boolean) {
    const effects: (() => unknown)[] = [],
      calls: string[] = [],
      events: string[] = [];
    const player = {
      volume: 0,
      play() {
        calls.push("play");
      },
      pause() {
        calls.push("pause");
      },
    };
    const status = {
      isLoaded,
      playing: false,
      isBuffering: false,
      didJustFinish: false,
      error: null as string | null,
    };
    const exports: any = {};
    const timers = new Map<number, () => void>();
    let timerId = 0;
    vm.runInNewContext(code, {
      exports,
      setTimeout: (fn: () => void) => {
        timers.set(++timerId, fn);
        return timerId;
      },
      clearTimeout: (id: number) => timers.delete(id),
      require: (id: string) => {
        if (id === "react")
          return {
            useRef: (current: unknown) => ({ current }),
            useEffect: (fn: () => unknown) => effects.push(fn),
          };
        if (id === "expo-audio")
          return {
            useAudioPlayer: (module: number, options: any) => {
              assert.equal(module, 1);
              assert.equal(options.downloadFirst, true);
              return player;
            },
            useAudioPlayerStatus: () => status,
            setAudioModeAsync: (mode: any) => {
              assert.equal(mode.shouldPlayInBackground, false);
              assert.equal(mode.allowsRecording, false);
              assert.equal(mode.playsInSilentMode, false);
              return Promise.resolve();
            },
          };
        throw Error(id);
      },
    });
    exports.NativeNarration({
      asset,
      token: 7,
      playing,
      volume: 0.5,
      onEnd: (token: number) => events.push(`end:${token}`),
      onError: (token: number) => events.push(`error:${token}`),
      onInterrupted: (token: number) => events.push(`interrupted:${token}`),
      onStatus: () => {},
    });
    const cleanup = effects.map((fn) => fn());
    await Promise.resolve();
    await Promise.resolve();
    return { effects, calls, events, status, timers, cleanup, player };
  }
  const waiting = await run(true, false);
  assert.ok(!waiting.calls.includes("play"));
  for (const callback of waiting.timers.values()) callback();
  assert.deepEqual(waiting.events, ["error:7"]);
  const ready = await run(true, true);
  assert.deepEqual(ready.calls, ["play"]);
  assert.equal(ready.player.volume, 0.5);
  ready.status.playing = true;
  ready.effects.at(-1)!();
  ready.status.playing = false;
  ready.effects.at(-1)!();
  assert.deepEqual(ready.events, ["interrupted:7"]);
  ready.status.didJustFinish = true;
  ready.effects.at(-1)!();
  ready.effects.at(-1)!();
  assert.equal(ready.events.filter((e) => e === "end:7").length, 1);
  const paused = await run(false, true);
  assert.ok(paused.calls.includes("pause"));
  assert.ok(!paused.calls.includes("play"));
});
