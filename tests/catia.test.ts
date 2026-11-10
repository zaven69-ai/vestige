import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  catiaBlockers,
  type CatiaReadiness,
} from "../src/lib/avatars/catia.ts";
import { readAvatarChoice } from "../src/lib/avatars/catalogue.ts";
// @ts-ignore Development asset audit uses Node ES modules.
import { auditCatia } from "../scripts/avatars/catia/audit.mjs";
const status = JSON.parse(
  readFileSync(
    new URL("../src/data/avatars/catia.json", import.meta.url),
    "utf8",
  ),
);
const metrics = JSON.parse(
  readFileSync(
    new URL("../assets/avatars/catia/rig-lab/rig-audit.json", import.meta.url),
    "utf8",
  ),
);
test("Catia original and exact original texture survive all three optimizations", () => {
  const result = auditCatia(fileURLToPath(new URL("../", import.meta.url)));
  assert.equal(result.originalPreserved, true);
  assert.equal(result.texturePreserved, true);
  assert.deepEqual(
    result.candidates.map((c: { triangles: number }) => c.triangles),
    [29996, 24996, 19995],
  );
  assert.equal(result.selected.triangles, status.optimizedTriangles);
  assert.equal(result.experimentalRig.bones, 17);
  assert.deepEqual(
    result.experimentalRig.clips.map((c: { name: string }) => c.name),
    ["idle", "walk", "run"],
  );
  assert.ok(
    result.experimentalRig.clips.every(
      (c: { movingChannels: number }) => c.movingChannels > 0,
    ),
  );
});
test("the experimental rig weights every vertex and synchronizes seams without claiming production quality", () => {
  assert.equal(metrics.weightCoverage, 1);
  assert.equal(metrics.maxInfluencesPerVertex, 4);
  assert.equal(metrics.productionApproved, false);
  assert.equal(metrics.deviceTested, false);
  assert.ok(
    metrics.clips.every(
      (clip: { deformationSamples: { maxSeamGapMeters: number }[] }) =>
        clip.deformationSamples.every(
          (sample) => sample.maxSeamGapMeters < 0.00002,
        ),
    ),
  );
  const failures = metrics.clips.filter(
    (clip: { groundCheckPassed: boolean; stretchCheckPassed: boolean }) =>
      !clip.groundCheckPassed || !clip.stretchCheckPassed,
  );
  if (failures.length) {
    assert.equal(status.deformationReviewed, false);
    assert.equal(status.qualityIssues.length, failures.length);
  }
});
test("Catia is blocked from map selection while review and device tests are incomplete", () => {
  assert.equal(status.mapEnabled, false);
  assert.ok(catiaBlockers(status).length > 0);
  assert.throws(() =>
    readAvatarChoice(JSON.stringify({ version: 1, choice: "catia" })),
  );
});
test("every readiness prerequisite is required, not merely the presence of a named clip", () => {
  const ready: CatiaReadiness = {
    sourcePreserved: true,
    optimizedTriangles: 24996,
    hasSkeleton: true,
    hasWeights: true,
    actualClips: ["idle", "walk", "run"],
    deformationReviewed: true,
    artApproved: true,
    iosDeviceTested: true,
    androidDeviceTested: true,
  };
  assert.deepEqual(catiaBlockers(ready), []);
  for (const key of [
    "sourcePreserved",
    "hasSkeleton",
    "hasWeights",
    "deformationReviewed",
    "artApproved",
    "iosDeviceTested",
    "androidDeviceTested",
  ] as const)
    assert.ok(catiaBlockers({ ...ready, [key]: false }).length > 0);
  for (const value of [NaN, Infinity, 35000, 10000])
    assert.ok(
      catiaBlockers({ ...ready, optimizedTriangles: value }).length > 0,
    );
  assert.ok(
    catiaBlockers({ ...ready, actualClips: ["idle", "walk"] }).length > 0,
  );
});
