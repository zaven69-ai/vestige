import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LocationSimulation,
  stickVector,
} from "../src/lib/developer/simulation.ts";
import {
  routingPositionFix,
  authoritativeNavigationFix,
  navigationPositionKey,
  type NavigationPosition,
} from "../src/lib/navigation/position.ts";
import { canUseLiveScope, canPersistLiveScope } from "../src/lib/live/scope.ts";
import { distance } from "../src/lib/game.ts";
import {
  arrivalTick,
  deviationTick,
  parseWalkingRoute,
  routeProgress,
} from "../src/lib/navigation/walking.ts";
import { RouteRequestGate } from "../src/lib/navigation/requests.ts";
const temple = { latitude: 45.525698, longitude: 4.874218 },
  cybele = { latitude: 45.524969, longitude: 4.875451 };
function start() {
  const sim = new LocationSimulation(true);
  sim.enable(temple, 100000);
  return sim;
}
test("production rejects activation, teleportation and joystick movement", () => {
  const sim = new LocationSimulation(false);
  assert.equal(sim.enable(temple), false);
  assert.equal(sim.teleportTo(cybele), false);
  sim.setStick(1, 1);
  sim.tick(1);
  assert.equal(sim.getSnapshot().enabled, false);
  assert.equal(sim.getSnapshot().fix, null);
  assert.equal(sim.canCommitRealProgress(), true);
});
test("joystick walks continuously at bounded speed, rotates with the map and stops on release", () => {
  const sim = start();
  sim.setStick(1, 0);
  for (let i = 1; i <= 40; i++) sim.tick(0.25, 100000 + i * 250);
  const end = sim.getSnapshot().fix!;
  assert.ok(Math.abs(distance(temple, end) - 14) < 0.01);
  assert.equal(end.heading, 90);
  assert.equal(end.speed, 1.4);
  sim.stop();
  sim.tick(0.25, 110250);
  assert.equal(distance(end, sim.getSnapshot().fix!), 0);
  assert.equal(sim.getSnapshot().fix!.speed, 0);
  const east = stickVector(0, 1, 90);
  assert.ok(Math.abs(east.east - 1) < 1e-8);
  assert.ok(Math.abs(east.north) < 1e-8);
  assert.deepEqual(stickVector(0.05, 0), { east: 0, north: 0 });
  const diagonal = stickVector(3, 3);
  assert.ok(Math.abs(Math.hypot(diagonal.east, diagonal.north) - 1) < 1e-8);
});
test("background lag never creates a long jump, and invalid coordinates do not replace the snapshot", () => {
  const sim = start();
  sim.setStick(0, 1);
  sim.tick(60, 160000);
  assert.ok(distance(temple, sim.getSnapshot().fix!) <= 0.701);
  const previous = sim.getSnapshot();
  assert.equal(sim.teleportTo({ latitude: NaN, longitude: 4 }), false);
  assert.equal(sim.teleportTo({ latitude: 91, longitude: 4 }), false);
  assert.equal(sim.getSnapshot(), previous);
  assert.deepEqual(stickVector(Infinity, 0), { east: 0, north: 0 });
});
test("teleport is immediate, resets motion, changes routing identity; exit erases all simulated coordinates", () => {
  const sim = start(),
    original = sim.getSnapshot();
  sim.setStick(1, 0);
  assert.equal(sim.teleportTo(cybele, 101000), true);
  assert.equal(distance(cybele, sim.getSnapshot().fix!), 0);
  assert.equal(sim.getSnapshot().teleport, original.teleport + 1);
  sim.tick(0.25, 101250);
  assert.equal(distance(cybele, sim.getSnapshot().fix!), 0);
  sim.disable();
  assert.equal(sim.getSnapshot().fix, null);
  assert.equal(sim.isEnabled(), false);
  assert.equal(sim.teleportTo(temple), false);
  assert.equal(sim.canCommitRealProgress(), true);
  sim.enable(temple, 102000);
  assert.equal(sim.getSnapshot().teleport, 0);
  assert.ok(sim.getSnapshot().epoch > original.epoch);
});
test("preview routing is development-only and never supplies an authoritative game fix", () => {
  const sim = start(),
    fix = sim.getSnapshot().fix!;
  const preview: NavigationPosition = {
    source: "developer-preview",
    fix,
    previewKey: "1:0",
  };
  assert.equal(routingPositionFix(preview, true), fix);
  assert.equal(routingPositionFix(preview, false), null);
  assert.equal(authoritativeNavigationFix(preview), null);
  assert.equal(routingPositionFix({ source: "device", fix }, false), fix);
  for (const previewScope of [false, true])
    for (const enabled of [false, true]) {
      assert.equal(
        canUseLiveScope(previewScope, enabled),
        previewScope === enabled,
      );
      assert.equal(
        canPersistLiveScope(previewScope, enabled),
        !previewScope && !enabled,
      );
    }
  assert.equal(sim.canCommitRealProgress(), false);
});
test("routing requests from a previous source or teleport cannot be applied after switching back to GPS", () => {
  const gate = new RouteRequestGate();
  const keys = [
    navigationPositionKey({ source: "device", fix: null }),
    navigationPositionKey({
      source: "developer-preview",
      fix: null,
      previewKey: "1:0",
    }),
    navigationPositionKey({
      source: "developer-preview",
      fix: null,
      previewKey: "1:1",
    }),
    navigationPositionKey({ source: "device", fix: null }),
  ];
  const tickets = keys.map((key) => gate.begin(key));
  for (const ticket of tickets.slice(0, -1))
    assert.equal(gate.accepts(ticket, keys.at(-1)!, true), false);
  assert.equal(gate.accepts(tickets.at(-1)!, keys.at(-1)!, true), true);
  assert.equal(new Set(keys.slice(0, 3)).size, 3);
});
test("the same pedestrian engine supports simulated progress, confirmed arrival and deviation dwell", () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL("./fixtures/navigation/temple-cybele.json", import.meta.url),
      "utf8",
    ),
  );
  const route = parseWalkingRoute(fixture, temple, cybele, 100000);
  const sim = start();
  const progress = routeProgress(route, sim.getSnapshot().fix!);
  assert.ok(progress.remainingMeters > 100);
  assert.ok(progress.remainingSeconds > 0);
  sim.teleportTo(cybele, 101000);
  const first = arrivalTick(
    { since: null, firstFixAt: null },
    sim.getSnapshot().fix!,
    cybele,
    101000,
  );
  assert.equal(first.arrived, false);
  sim.tick(0.25, 104500);
  assert.equal(
    arrivalTick(first.state, sim.getSnapshot().fix!, cybele, 104500).arrived,
    true,
  );
  sim.teleportTo(
    { latitude: temple.latitude + 0.002, longitude: temple.longitude },
    140000,
  );
  const off = routeProgress(route, sim.getSnapshot().fix!);
  assert.ok(off.offRouteMeters > 45);
  const a = deviationTick(
    { since: null, firstFixAt: null },
    sim.getSnapshot().fix!,
    off.offRouteMeters,
    140000,
    100000,
  );
  assert.equal(a.recalculate, false);
  sim.tick(0.25, 147000);
  assert.equal(
    deviationTick(
      a.state,
      sim.getSnapshot().fix!,
      off.offRouteMeters,
      147000,
      100000,
    ).recalculate,
    true,
  );
});
test("simulation never imports persistence or analytics; the real discovery entry point guards before and after awaiting storage", () => {
  const root = new URL("../", import.meta.url),
    source = (p: string) => readFileSync(new URL(p, root), "utf8");
  assert.doesNotMatch(
    source("src/lib/developer/simulation.ts"),
    /from.*(?:storage|sqlite|analytics|progress)/i,
  );
  const store = source("src/lib/store.tsx"),
    claim = store.slice(store.indexOf("const discover:"));
  assert.ok(
    claim.indexOf("canCommitRealProgress") < claim.indexOf("canDiscover"),
  );
  assert.match(
    claim,
    /await progressDatabase\(\);\s*if \(!simulation.canCommitRealProgress\(\)\) return "simulation";\s*await recordDiscovery/,
  );
  assert.match(
    source("src/components/monuments/MonumentDetails.tsx"),
    /!location.enabled && canDiscover/,
  );
});
