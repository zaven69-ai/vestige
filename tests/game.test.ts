import { test } from "node:test";
import assert from "node:assert/strict";
import {
  distance,
  canDiscover,
  levelFor,
  formatDistance,
  readJournal,
  totalXP,
} from "../src/lib/game.ts";
const temple = { latitude: 45.5255, longitude: 4.8742 };
const now = 1800000000000;
const fix = { ...temple, accuracy: 10, timestamp: now };
test("distance GPS réelle et symétrique", () => {
  assert.equal(distance(temple, temple), 0);
  const lyon = { latitude: 45.762391, longitude: 4.822415 };
  assert.ok(distance(temple, lyon) > 26000);
  assert.ok(distance(temple, lyon) < 28000);
  assert.equal(distance(temple, lyon), distance(lyon, temple));
});
test("découverte à proximité avec GPS récent", () => {
  assert.equal(canDiscover(fix, temple, now), true);
  assert.equal(canDiscover({ ...fix, latitude: 45.526 }, temple, now), true);
});
test("aucune découverte distante ou sans autorisation GPS", () => {
  assert.equal(canDiscover(null, temple, now), false);
  assert.equal(canDiscover({ ...fix, latitude: 45.53 }, temple, now), false);
});
test("refus des positions périmées, futures ou imprécises", () => {
  for (const patch of [
    { timestamp: now - 30000 },
    { timestamp: now + 1000 },
    { accuracy: 51 },
    { accuracy: null },
  ])
    assert.equal(canDiscover({ ...fix, ...patch }, temple, now), false);
});
test("niveau tous les 400 XP et format des distances", () => {
  assert.equal(levelFor(0), 1);
  assert.equal(levelFor(399), 1);
  assert.equal(levelFor(400), 2);
  assert.equal(levelFor(1000), 3);
  assert.equal(formatDistance(150), "150 m");
  assert.equal(formatDistance(1250), "1.3 km");
});

test("le carnet survit à une sérialisation et ignore les identifiants inconnus", () => {
  const catalogue = [
    { id: "auguste", xp: 150 },
    { id: "fourviere", xp: 150 },
  ];
  const saved = JSON.stringify({
    auguste: now,
    unknown: now,
    fourviere: "invalid",
  });
  const journal = readJournal(
    saved,
    catalogue.map((m) => m.id),
  );
  assert.deepEqual(journal, { auguste: now });
  assert.equal(totalXP(journal, catalogue), 150);
  assert.equal(totalXP({ ...journal, auguste: now + 1 }, catalogue), 150);
  assert.deepEqual(readJournal(null, []), {});
});
test("un carnet corrompu est signalé sans remise à zéro silencieuse", () => {
  for (const raw of ["invalid", "null", "[]", "42"])
    assert.throws(() => readJournal(raw, []));
});
