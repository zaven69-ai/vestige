import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
// @ts-ignore Asset audit is a dependency-free Node ES module.
import { auditRevision } from "../scripts/avatars/catia/revision2/audit.mjs";
const load = (path: string) =>
  JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const report = load(
  "assets/avatars/catia/rig-lab/revision-2/correction-report.json",
);
test("corrected GLB keeps original geometry, UV and texture and contains real mobile humanoid animations", () => {
  const result = auditRevision(fileURLToPath(new URL("../", import.meta.url)));
  assert.equal(result.triangles, 24996);
  assert.equal(result.bones, 17);
  assert.ok(
    result.neutralGeometryAndUVPreserved &&
      result.texturePreserved &&
      result.sourcePreserved,
  );
  assert.deepEqual(
    result.clips.map((clip: { name: string }) => clip.name),
    ["idle", "walk", "run"],
  );
  assert.ok(
    result.clips.every(
      (clip: { movingChannels: number }) => clip.movingChannels > 0,
    ),
  );
  assert.equal(result.mapEnabled, false);
  assert.equal(result.deviceTested, false);
});
test("Walk and Run deformation improve using the same percentile metric as the original rig", () => {
  for (const name of ["walk", "run"]) {
    const before = report.baseline.find(
      (c: { name: string }) => c.name === name,
    );
    const after = report.clips.find((c: { name: string }) => c.name === name);
    const worst = (clip: { samples: { p99EdgeStretch: number }[] }) =>
      Math.max(...clip.samples.map((s) => s.p99EdgeStretch));
    assert.ok(worst(after) < worst(before));
    assert.ok(worst(after) < 2);
  }
});
test("every corrected frame and half-frame is sampled with closed loops and grounded stance feet", () => {
  for (const clip of report.clips) {
    assert.ok(clip.samples.length >= Math.round(clip.durationSeconds * 30 * 2));
    assert.ok(clip.loopMaxPositionErrorMeters < 1e-5);
    for (const sample of clip.samples) {
      assert.ok(sample.minZ >= -0.002);
      assert.ok(sample.maxEdgeStretch < 2);
      assert.ok(sample.maxSeamGapMeters < 0.00002);
      for (const z of Object.values(sample.stanceSoleZ ?? {}))
        assert.ok(Math.abs(z as number) < 0.002);
    }
  }
});
test("the independently reimported exported GLB passes motion checks without enabling Catia", () => {
  const roundtrip = load(
    "assets/avatars/catia/rig-lab/revision-2/roundtrip-report.json",
  );
  assert.equal(roundtrip.roundTripPassed, true);
  assert.equal(roundtrip.mapEnabled, false);
  assert.equal(roundtrip.clips.length, 3);
  assert.ok(
    roundtrip.clips.every(
      (c: {
        name: string;
        groundPassed: boolean;
        stretchPassed: boolean;
        stanceContactPassed: boolean;
      }) =>
        c.groundPassed &&
        c.stretchPassed &&
        (c.name === "idle" || c.stanceContactPassed),
    ),
  );
});
