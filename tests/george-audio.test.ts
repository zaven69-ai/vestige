import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  audioProgress,
  audioTime,
  admitPrivateDemo,
  finishedAudio,
  type AudioPlayback,
} from "../src/lib/live/audioPlayback.ts";
import { georgeDemo } from "../src/data/live/georgeDemo.ts";
import { playableAsset } from "../src/lib/live/eligibility.ts";
import type { LiveStory } from "../src/lib/live/types.ts";
const playback: AudioPlayback = {
  storyId: georgeDemo.id,
  kind: "private-demo",
  token: 1,
  intent: "play",
  status: "playing",
  position: 0,
  duration: 34.22,
  ended: false,
};
test("private George prototype is manual, development-only and foreground-only", () => {
  assert.equal(admitPrivateDemo(true, true, true, true), true);
  for (const values of [
    [false, true, true, true],
    [true, false, true, true],
    [true, true, false, true],
    [true, true, true, false],
  ])
    assert.equal(
      admitPrivateDemo(...(values as [boolean, boolean, boolean, boolean])),
      false,
    );
  const stories = JSON.parse(
    readFileSync(
      new URL("../src/data/live/stories.json", import.meta.url),
      "utf8",
    ),
  );
  assert.ok(!stories.some((s: any) => s.id === georgeDemo.id));
  assert.equal(georgeDemo.status, "private_unreviewed");
  assert.equal(georgeDemo.transcriptStatus, "provided_unreviewed");
  assert.ok(georgeDemo.transcript.includes("Presqu'île lyonnaise"));
  assert.ok(
    georgeDemo.transcript.includes("imprimeurs, libraires et marchands"),
  );
});
test("audio progress is finite, bounded and finish retains the player for replay without writing rewards", () => {
  const next = audioProgress(playback, 12, 34.22);
  assert.equal(next.position, 12);
  assert.equal(audioProgress(next, NaN, 34), next);
  assert.equal(audioProgress(next, -1, 34), next);
  assert.equal(audioProgress(next, 13, Infinity), next);
  assert.equal(audioProgress(next, 100, 34.22).position, 34.22);
  const ended = finishedAudio(next);
  assert.equal(ended.intent, "pause");
  assert.equal(ended.ended, true);
  assert.equal(ended.position, 34.22);
  assert.equal(audioProgress(ended, 0, 34.22), ended);
  assert.equal(audioTime(34.22), "0:34");
  assert.equal(audioTime(NaN), "--:--");
});
test("URI assets must still match a human-approved version and rights; a draft never becomes playable", () => {
  const script = "Version test",
    hash = "a".repeat(64);
  const story: LiveStory = {
    id: "approved",
    poiId: "a",
    title: "Test",
    language: "fr",
    version: 1,
    script,
    contentHash: hash,
    origin: "vestige_editorial",
    status: "live_editorial_approved",
    sources: [
      {
        title: "Source",
        url: "https://example.org",
        publisher: "Test",
        author: null,
        publishedAt: null,
        consultedAt: "2026-11-11",
      },
    ],
    approval: {
      version: 1,
      contentHash: hash,
      approvedText: script,
      approvedBy: "Reviewer",
      approvedAt: "2026-11-11T00:00:00Z",
      humanReview: true,
    },
    audioId: "asset",
  };
  const asset = {
    id: "asset",
    storyId: "approved",
    scriptVersion: 1,
    contentHash: hash,
    sha256: hash,
    rightsHolder: "Owner",
    license: "Authorized",
    uri: "https://example.org/audio.mp3",
  };
  assert.equal(playableAsset(story, { asset }), asset);
  assert.equal(playableAsset({ ...story, status: "draft" }, { asset }), null);
  assert.equal(playableAsset({ ...story, version: 2 }, { asset }), null);
  assert.equal(
    playableAsset(story, { asset: { ...asset, license: "" } }),
    null,
  );
  assert.equal(
    playableAsset(story, {
      asset: { ...asset, uri: "http://example.org/audio.mp3" },
    }),
    null,
  );
});

test("Explorer owns the audio UI and the prototype cannot enter automatic geofencing or reward writes", () => {
  const source = (p: string) =>
    readFileSync(new URL("../" + p, import.meta.url), "utf8");
  assert.match(source("src/app/(tabs)/index.tsx"), /<ExplorerAudioPlayer/);
  const provider = source("src/lib/live/LiveProvider.tsx");
  const end = provider.slice(
    provider.indexOf("const onEnd ="),
    provider.indexOf("const onError ="),
  );
  assert.doesNotMatch(end, /advance\(|recordDiscovery|setXP/);
  assert.match(
    provider,
    /admitPrivateDemo\(__DEV__, true, foreground, visible\)/,
  );
  assert.match(
    source("src/components/developer/DeveloperControls.tsx"),
    /Tester l’audio George/,
  );
  const geo = provider.slice(
    provider.indexOf("const tick ="),
    provider.indexOf("const onEnd ="),
  );
  assert.match(geo, /liveStories.find/);
  assert.doesNotMatch(geo, /georgeDemo/);
});
