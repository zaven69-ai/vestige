import { test } from "node:test";
import assert from "node:assert/strict";
import {
  avatarMotion,
  angularDistance,
  isFreshFix,
  playerDirection,
} from "../src/lib/exploration.ts";
import type { Fix } from "../src/lib/game.ts";
const now = 1_800_000_000_000;
const fix: Fix = {
  latitude: 45.5255,
  longitude: 4.8742,
  accuracy: 10,
  timestamp: now,
};
test("aucun déplacement inventé pour un GPS immobile ou une petite dérive", () => {
  assert.equal(
    avatarMotion(fix, { ...fix, timestamp: now + 5000 }, false),
    "hold",
  );
  assert.equal(
    avatarMotion(
      fix,
      { ...fix, latitude: fix.latitude + 0.00001, timestamp: now + 5000 },
      false,
    ),
    "hold",
  );
  assert.equal(
    avatarMotion(
      fix,
      { ...fix, latitude: fix.latitude + 0.001, timestamp: now - 5000 },
      false,
    ),
    "hold",
  );
});
test("seuls les déplacements réels récents et précis sont interpolés", () => {
  const next = {
    ...fix,
    latitude: fix.latitude + 0.0001,
    timestamp: now + 5000,
  };
  assert.equal(avatarMotion(fix, next, false), "animate");
  assert.equal(avatarMotion(fix, next, true), "snap");
  for (const patch of [
    { accuracy: 100 },
    { accuracy: null },
    { timestamp: now + 31000 },
    { latitude: fix.latitude + 0.01 },
  ])
    assert.equal(avatarMotion(fix, { ...next, ...patch }, false), "snap");
});
test("les positions invalides et périmées ne sont pas présentées comme courantes", () => {
  assert.equal(isFreshFix(fix, now), true);
  for (const candidate of [
    null,
    { ...fix, timestamp: now - 30000 },
    { ...fix, timestamp: now + 10000 },
    { ...fix, latitude: NaN },
    { ...fix, longitude: 181 },
  ])
    assert.equal(isFreshFix(candidate, now), false);
});
test("la direction exige un cap calibré ou un déplacement GPS suffisamment fiable", () => {
  assert.equal(
    playerDirection({ degrees: 359, accuracy: 2, timestamp: now }, fix, now),
    359,
  );
  assert.equal(
    playerDirection({ degrees: 90, accuracy: 1, timestamp: now }, fix, now),
    null,
  );
  assert.equal(
    playerDirection({ degrees: -1, accuracy: 3, timestamp: now }, fix, now),
    null,
  );
  assert.equal(
    playerDirection(
      { degrees: 90, accuracy: 3, timestamp: now - 15000 },
      fix,
      now,
    ),
    null,
  );
  assert.equal(
    playerDirection(null, { ...fix, heading: 120, speed: 1.2 }, now),
    120,
  );
  assert.equal(
    playerDirection(null, { ...fix, heading: 120, speed: 0 }, now),
    null,
  );
  assert.equal(
    playerDirection(
      null,
      { ...fix, heading: 120, speed: 1.2, accuracy: 60 },
      now,
    ),
    null,
  );
  assert.equal(
    playerDirection({ degrees: 90, accuracy: 3, timestamp: now }, null, now),
    null,
  );
});
test("le passage du nord ne fait pas tourner l’avatar de presque un tour", () => {
  assert.equal(angularDistance(359, 1), 2);
  assert.equal(angularDistance(1, 359), 2);
});
