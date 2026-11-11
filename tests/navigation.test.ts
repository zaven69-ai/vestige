import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  decodePolyline6,
  walkingRequest,
  parseWalkingRoute,
  fetchWalkingRoute,
  routeProgress,
  deviationTick,
  arrivalTick,
  validNavigationFix,
  phoneNavigationURL,
} from "../src/lib/navigation/walking.ts";
import { distance } from "../src/lib/game.ts";
const temple = { latitude: 45.525698, longitude: 4.874218 },
  cybele = { latitude: 45.524969, longitude: 4.875451 },
  theatre = { latitude: 45.524787, longitude: 4.878314 },
  lyon = { latitude: 45.7578, longitude: 4.832 };
const fixture = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(`./fixtures/navigation/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
const load = (id: string, start: typeof temple, end: typeof temple) =>
  parseWalkingRoute(fixture(id), start, end, 100000);
for (const [id, start, target] of [
  ["lyon-temple", lyon, temple],
  ["temple-cybele", temple, cybele],
  ["cybele-theatre", cybele, theatre],
] as const)
  test(`actual pedestrian response ${id} supplies street geometry, metrics and French maneuvers`, () => {
    const route = load(id, start, target);
    assert.ok(route.coordinates.length > 2);
    assert.ok(route.meters > distance(start, target));
    assert.ok(route.seconds > 0);
    assert.ok(route.maneuvers.length >= 3);
    assert.ok(
      route.maneuvers.some((m) =>
        /Marchez|Tournez|Continuez/.test(m.instruction),
      ),
    );
    assert.ok(distance(start, route.coordinates[0]) < 100);
    assert.ok(distance(target, route.coordinates.at(-1)!) < 30);
    assert.equal(route.meters, fixture(id).trip.summary.length * 1000);
    assert.equal(route.seconds, fixture(id).trip.summary.time);
  });
test("request explicitly uses pedestrian costing, kilometers and French, without a secret token", () => {
  const query = JSON.parse(
    new URL(walkingRequest(lyon, temple)).searchParams.get("json")!,
  );
  assert.equal(query.costing, "pedestrian");
  assert.equal(query.directions_options.language, "fr-FR");
  assert.equal(query.directions_options.units, "kilometers");
  assert.equal(query.locations[0].lat, lyon.latitude);
  assert.throws(
    () => walkingRequest({ latitude: 48.85, longitude: 2.35 }, temple),
    /50 km/,
  );
  assert.throws(
    () => walkingRequest({ latitude: NaN, longitude: 2 }, temple),
    /Coordonnées/,
  );
});
test("invalid or non-pedestrian responses are rejected instead of drawing a direct line", () => {
  for (const mutate of [
    (d: any) => {
      d.trip.status = 1;
    },
    (d: any) => {
      d.trip.units = "miles";
    },
    (d: any) => {
      d.trip.summary.length = null;
    },
    (d: any) => {
      d.trip.legs[0].maneuvers[0].travel_mode = "drive";
    },
    (d: any) => {
      d.trip.legs[0].shape = "?";
    },
    (d: any) => {
      d.trip.legs[0].maneuvers[0].end_shape_index = 99999;
    },
  ]) {
    const d = fixture("temple-cybele");
    mutate(d);
    assert.throws(() => parseWalkingRoute(d, temple, cybele, 0));
  }
  assert.throws(() => decodePolyline6("~"));
  assert.throws(() => decodePolyline6("\u0001"));
});
test("remaining distance decreases along the real route and turn distances come from shape indices", () => {
  const route = load("cybele-theatre", cybele, theatre);
  const begin = routeProgress(route, route.coordinates[0]),
    middle = routeProgress(
      route,
      route.coordinates[Math.floor(route.coordinates.length / 2)],
    ),
    end = routeProgress(route, route.coordinates.at(-1)!);
  assert.ok(begin.remainingMeters > middle.remainingMeters);
  assert.ok(middle.remainingMeters > end.remainingMeters);
  assert.ok(end.remainingMeters < 1);
  assert.ok(begin.metersToTurn >= 0);
  assert.equal(begin.instruction, route.maneuvers[0].instruction);
  assert.equal(begin.nextInstruction, route.maneuvers[1].instruction);
  assert.ok(middle.offRouteMeters < 1);
  const far = routeProgress(route, { latitude: 45.53, longitude: 4.885 });
  assert.ok(far.offRouteMeters > 100);
});
test("off-route recalculation needs sustained accurate displacement, fresh fixes and cooldown", () => {
  const fix = { ...temple, accuracy: 5, timestamp: 100000 };
  const first = deviationTick(
    { since: null, firstFixAt: null },
    fix,
    80,
    100000,
    0,
  );
  assert.equal(first.recalculate, false);
  assert.equal(
    deviationTick(first.state, fix, 80, 107000, 0).recalculate,
    false,
    "a single frozen fix is insufficient",
  );
  const next = { ...fix, timestamp: 107000 };
  assert.equal(
    deviationTick(first.state, next, 80, 107000, 0).recalculate,
    true,
  );
  assert.equal(
    deviationTick(first.state, next, 80, 107000, 100000).recalculate,
    false,
    "30 second request cooldown",
  );
  assert.equal(
    deviationTick(first.state, { ...next, accuracy: 50 }, 60, 107000, 0)
      .recalculate,
    false,
    "GPS uncertainty cannot cause repeated recalculation",
  );
  assert.equal(
    deviationTick(first.state, next, 5, 107000, 0).state.since,
    null,
  );
  assert.equal(
    deviationTick(first.state, { ...next, accuracy: 90 }, 80, 107000, 0).state
      .since,
    null,
  );
});
test("arrival is confirmed near the real target with good accuracy and multiple fixes, never from listening", () => {
  const fix = { ...cybele, accuracy: 5, timestamp: 100000 };
  const first = arrivalTick(
    { since: null, firstFixAt: null },
    fix,
    cybele,
    100000,
  );
  assert.equal(first.arrived, false);
  assert.equal(arrivalTick(first.state, fix, cybele, 105000).arrived, false);
  assert.equal(
    arrivalTick(first.state, { ...fix, timestamp: 105000 }, cybele, 105000)
      .arrived,
    true,
  );
  assert.equal(
    arrivalTick(
      first.state,
      { ...fix, timestamp: 105000, accuracy: 40 },
      cybele,
      105000,
    ).arrived,
    false,
  );
  assert.equal(
    arrivalTick(
      first.state,
      { ...temple, timestamp: 105000, accuracy: 5 },
      cybele,
      105000,
    ).arrived,
    false,
  );
});
test("missing, stale, future and invalid GPS cannot power guidance", () => {
  const fix = { ...temple, timestamp: 100000, accuracy: 5 };
  assert.equal(validNavigationFix(fix, 100000), true);
  for (const changed of [
    null,
    { ...fix, timestamp: 80000 },
    { ...fix, timestamp: 100001 },
    { ...fix, accuracy: null },
    { ...fix, accuracy: 80 },
    { ...fix, latitude: 200 },
    { ...fix, longitude: NaN },
  ])
    assert.equal(validNavigationFix(changed, 100000), false);
});
test("HTTP errors, no network and abort never produce a synthetic route", async () => {
  const signal = new AbortController().signal;
  for (const status of [400, 429, 503])
    await assert.rejects(
      fetchWalkingRoute(temple, cybele, signal, (async () => ({
        ok: false,
        status,
      })) as any),
    );
  await assert.rejects(
    fetchWalkingRoute(temple, cybele, signal, (async () => {
      throw Error("Network request failed");
    }) as any),
    /Network/,
  );
  await assert.rejects(
    fetchWalkingRoute(temple, cybele, signal, (async () => ({
      ok: true,
      text: async () => "<html>error</html>",
    })) as any),
    /illisible/,
  );
  const route = await fetchWalkingRoute(temple, cybele, signal, (async (
    url: any,
    options: any,
  ) => {
    assert.equal(options.signal, signal);
    assert.equal(new URL(url).host, "valhalla1.openstreetmap.de");
    return {
      ok: true,
      text: async () => JSON.stringify(fixture("temple-cybele")),
    };
  }) as any);
  assert.equal(route.meters, 173);
});
test("phone navigation uses the requested destination and lets the phone obtain its own real origin", () => {
  const ios = new URL(phoneNavigationURL(temple, "ios"));
  assert.equal(ios.hostname, "maps.apple.com");
  assert.equal(ios.searchParams.get("dirflg"), "d");
  assert.equal(
    ios.searchParams.get("daddr"),
    `${temple.latitude},${temple.longitude}`,
  );
  assert.equal(ios.searchParams.has("saddr"), false);
  const android = new URL(phoneNavigationURL(cybele, "android"));
  assert.equal(android.searchParams.get("travelmode"), "driving");
  assert.equal(android.searchParams.has("origin"), false);
});

test("real request gate discards late responses after reroute, destination change, stop or background", async () => {
  const { RouteRequestGate } =
    await import("../src/lib/navigation/requests.ts");
  const gate = new RouteRequestGate();
  const first = gate.begin("temple");
  const second = gate.begin("cybele");
  assert.equal(first.controller.signal.aborted, true);
  assert.equal(gate.accepts(first, "temple", true), false);
  assert.equal(gate.accepts(second, "cybele", true), true);
  assert.equal(gate.accepts(second, "theatre", true), false);
  assert.equal(gate.accepts(second, "cybele", false), false);
  gate.finish(first);
  assert.equal(gate.pending, second);
  gate.cancel();
  assert.equal(second.controller.signal.aborted, true);
  assert.equal(gate.accepts(second, "cybele", true), false);
  const latest = gate.begin("theatre");
  gate.finish(latest);
  assert.equal(gate.pending, null);
});

test("even a transport ignoring abort cannot return a usable canceled route", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    fetchWalkingRoute(temple, cybele, controller.signal, (async () => ({
      ok: true,
      text: async () => JSON.stringify(fixture("temple-cybele")),
    })) as any),
    /annulé/,
  );
  const during = new AbortController();
  await assert.rejects(
    fetchWalkingRoute(temple, cybele, during.signal, (async () => ({
      ok: true,
      text: async () => {
        during.abort();
        return JSON.stringify(fixture("temple-cybele"));
      },
    })) as any),
    /annulé/,
  );
});

test("walking duration formatting preserves engine seconds as minutes or hours", async () => {
  const { formatWalkingTime } =
    await import("../src/lib/navigation/walking.ts");
  assert.equal(formatWalkingTime(21287.892), "5 h 55 min");
  assert.equal(formatWalkingTime(129.245), "3 min");
  assert.equal(formatWalkingTime(20), "moins d’1 min");
});
