import { distance, type Point, type Fix } from "../game.ts";
export const WALK_ROUTER = "https://valhalla1.openstreetmap.de/route";
export const navigationSpec = {
  maxDirectMeters: 50000,
  maxAgeMs: 15000,
  maxAccuracy: 50,
  offRouteMeters: 45,
  offRouteDwellMs: 6000,
  recalculationCooldownMs: 30000,
  arrivalMeters: 30,
  arrivalAccuracy: 25,
  arrivalDwellMs: 3000,
} as const;
export type Maneuver = {
  instruction: string;
  begin: number;
  end: number;
  seconds: number;
  meters: number;
};
export type WalkingRoute = {
  coordinates: Point[];
  cumulative: number[];
  meters: number;
  seconds: number;
  maneuvers: Maneuver[];
  requestedAt: number;
  start: Point;
  target: Point;
  provider: "Valhalla / FOSSGIS";
};
export function validNavigationFix(fix: Fix | null, now: number): fix is Fix {
  return (
    !!fix &&
    Number.isFinite(fix.latitude) &&
    Math.abs(fix.latitude) <= 90 &&
    Number.isFinite(fix.longitude) &&
    Math.abs(fix.longitude) <= 180 &&
    fix.accuracy !== null &&
    Number.isFinite(fix.accuracy) &&
    fix.accuracy >= 0 &&
    fix.accuracy <= navigationSpec.maxAccuracy &&
    now >= fix.timestamp &&
    now - fix.timestamp <= navigationSpec.maxAgeMs
  );
}
export function decodePolyline6(encoded: string): Point[] {
  if (typeof encoded !== "string" || encoded.length > 1000000)
    throw Error("Géométrie de trajet invalide.");
  const points: Point[] = [];
  let index = 0,
    lat = 0,
    lon = 0;
  function read() {
    let result = 0,
      shift = 0,
      b = 0;
    do {
      if (index >= encoded.length || shift > 30)
        throw Error("Géométrie de trajet tronquée.");
      b = encoded.charCodeAt(index++) - 63;
      if (b < 0 || b > 63) throw Error("Géométrie de trajet invalide.");
      result |= (b & 31) << shift;
      shift += 5;
    } while (b >= 32);
    return result & 1 ? ~(result >>> 1) : result >>> 1;
  }
  while (index < encoded.length) {
    lat += read();
    lon += read();
    const p = { latitude: lat / 1e6, longitude: lon / 1e6 };
    if (
      Math.abs(p.latitude) > 90 ||
      Math.abs(p.longitude) > 180 ||
      points.length >= 30000
    )
      throw Error("Trajet hors limites.");
    points.push(p);
  }
  return points;
}
export function walkingRequest(start: Point, target: Point) {
  if (
    [start, target].some(
      (p) =>
        !Number.isFinite(p.latitude) ||
        !Number.isFinite(p.longitude) ||
        Math.abs(p.latitude) > 90 ||
        Math.abs(p.longitude) > 180,
    )
  )
    throw Error("Coordonnées indisponibles.");
  if (distance(start, target) > navigationSpec.maxDirectMeters)
    throw Error(
      "Trajet trop éloigné pour ce service piéton (50 km à vol d’oiseau maximum). Rejoignez Vienne avec la navigation du téléphone, puis relancez le guidage à pied.",
    );
  const json = {
    locations: [
      { lat: start.latitude, lon: start.longitude },
      { lat: target.latitude, lon: target.longitude },
    ],
    costing: "pedestrian",
    directions_options: { units: "kilometers", language: "fr-FR" },
  };
  return `${WALK_ROUTER}?json=${encodeURIComponent(JSON.stringify(json))}`;
}
export function parseWalkingRoute(
  raw: unknown,
  start: Point,
  target: Point,
  now: number,
): WalkingRoute {
  const data = raw as any,
    trip = data?.trip,
    leg = trip?.legs?.[0];
  if (
    !trip ||
    trip.status !== 0 ||
    trip.units !== "kilometers" ||
    !Array.isArray(trip.legs) ||
    trip.legs.length !== 1 ||
    !leg ||
    !Array.isArray(leg.maneuvers) ||
    !leg.maneuvers.length
  )
    throw Error("Le moteur n’a pas trouvé de trajet piéton utilisable.");
  if (
    !Number.isFinite(trip.summary?.length) ||
    trip.summary.length < 0 ||
    !Number.isFinite(trip.summary?.time) ||
    trip.summary.time < 0
  )
    throw Error("Distance ou durée absente du moteur.");
  const coordinates = decodePolyline6(leg.shape);
  if (
    coordinates.length < 2 ||
    distance(start, coordinates[0]) > 100 ||
    distance(target, coordinates.at(-1)!) > 100
  )
    throw Error("Les points sont trop éloignés du réseau piéton disponible.");
  const maneuvers: Maneuver[] = leg.maneuvers.map((m: any) => {
    if (
      m.travel_mode !== "pedestrian" ||
      typeof m.instruction !== "string" ||
      !m.instruction.trim() ||
      !Number.isInteger(m.begin_shape_index) ||
      !Number.isInteger(m.end_shape_index) ||
      m.begin_shape_index < 0 ||
      m.end_shape_index < m.begin_shape_index ||
      m.end_shape_index >= coordinates.length ||
      !Number.isFinite(m.time) ||
      m.time < 0 ||
      !Number.isFinite(m.length) ||
      m.length < 0
    )
      throw Error("Instructions piétonnes invalides.");
    return {
      instruction: m.instruction,
      begin: m.begin_shape_index,
      end: m.end_shape_index,
      seconds: m.time,
      meters: m.length * 1000,
    };
  });
  if (maneuvers.some((m, i) => i > 0 && m.begin < maneuvers[i - 1].begin))
    throw Error("Ordre des instructions invalide.");
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i++)
    cumulative.push(
      cumulative[i - 1] + distance(coordinates[i - 1], coordinates[i]),
    );
  if (cumulative.at(-1)! > 500000)
    throw Error("Trajet trop long pour le guidage à pied.");
  return {
    coordinates,
    cumulative,
    meters: trip.summary.length * 1000,
    seconds: trip.summary.time,
    maneuvers,
    requestedAt: now,
    start,
    target,
    provider: "Valhalla / FOSSGIS",
  };
}
export async function fetchWalkingRoute(
  start: Point,
  target: Point,
  signal: AbortSignal,
  transport: typeof fetch = fetch,
): Promise<WalkingRoute> {
  if (signal.aborted) throw Error("Calcul annulé.");
  const response = await transport(walkingRequest(start, target), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw Error(
      response.status === 400
        ? "Aucun itinéraire piéton trouvé pour ces positions."
        : response.status === 429
          ? "Le service de routage est sollicité. Réessayez dans un instant."
          : `Service de routage indisponible (HTTP ${response.status}).`,
    );
  const text = await response.text();
  if (signal.aborted) throw Error("Calcul annulé.");
  if (text.length > 2000000)
    throw Error("Réponse de routage trop volumineuse.");
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw Error("Réponse de routage illisible.");
  }
  return parseWalkingRoute(json, start, target, Date.now());
}
export function routeProgress(route: WalkingRoute, point: Point) {
  const scale = Math.cos((point.latitude * Math.PI) / 180),
    metersDegree = 111320;
  let nearest = Infinity,
    along = 0,
    segment = 0;
  for (let i = 0; i < route.coordinates.length - 1; i++) {
    const a = route.coordinates[i],
      b = route.coordinates[i + 1];
    const ax = (a.longitude - point.longitude) * scale * metersDegree,
      ay = (a.latitude - point.latitude) * metersDegree;
    const bx = (b.longitude - point.longitude) * scale * metersDegree,
      by = (b.latitude - point.latitude) * metersDegree;
    const dx = bx - ax,
      dy = by - ay,
      length2 = dx * dx + dy * dy;
    const t =
      length2 === 0
        ? 0
        : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length2));
    const error = Math.hypot(ax + t * dx, ay + t * dy);
    if (error < nearest) {
      nearest = error;
      segment = i;
      along =
        route.cumulative[i] +
        t * (route.cumulative[i + 1] - route.cumulative[i]);
    }
  }
  const total = route.cumulative.at(-1) ?? 0,
    remainingRatio = total > 0 ? Math.max(0, 1 - along / total) : 0;
  const index = Math.max(
    0,
    route.maneuvers.findIndex((m) => m.end > segment),
  );
  const maneuver = route.maneuvers[index],
    next = route.maneuvers[index + 1];
  return {
    offRouteMeters: nearest,
    alongMeters: along,
    segment,
    remainingMeters: route.meters * remainingRatio,
    remainingSeconds: route.seconds * remainingRatio,
    instruction: maneuver.instruction,
    nextInstruction: next?.instruction ?? null,
    metersToTurn: Math.max(0, route.cumulative[maneuver.end] - along),
  };
}
export type DeviationState = {
  since: number | null;
  firstFixAt: number | null;
};
export function deviationTick(
  state: DeviationState,
  fix: Fix | null,
  offRouteMeters: number,
  now: number,
  lastRequestAt: number,
) {
  if (
    !validNavigationFix(fix, now) ||
    offRouteMeters <=
      Math.max(navigationSpec.offRouteMeters, (fix.accuracy ?? 0) * 1.5)
  )
    return { state: { since: null, firstFixAt: null }, recalculate: false };
  const next = {
    since: state.since ?? now,
    firstFixAt: state.firstFixAt ?? fix.timestamp,
  };
  return {
    state: next,
    recalculate:
      now - next.since >= navigationSpec.offRouteDwellMs &&
      fix.timestamp - next.firstFixAt >= navigationSpec.offRouteDwellMs &&
      now - lastRequestAt >= navigationSpec.recalculationCooldownMs,
  };
}
export function arrivalTick(
  state: DeviationState,
  fix: Fix | null,
  target: Point,
  now: number,
) {
  if (
    !validNavigationFix(fix, now) ||
    fix.accuracy! > navigationSpec.arrivalAccuracy ||
    distance(fix, target) > navigationSpec.arrivalMeters
  )
    return { state: { since: null, firstFixAt: null }, arrived: false };
  const next = {
    since: state.since ?? now,
    firstFixAt: state.firstFixAt ?? fix.timestamp,
  };
  return {
    state: next,
    arrived:
      now - next.since >= navigationSpec.arrivalDwellMs &&
      fix.timestamp - next.firstFixAt >= navigationSpec.arrivalDwellMs,
  };
}
export function phoneNavigationURL(target: Point, platform: string) {
  const dest = `${target.latitude},${target.longitude}`;
  return platform === "ios"
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(dest)}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
}

export function formatWalkingTime(seconds: number) {
  const minutes = Math.ceil(Math.max(0, seconds) / 60);
  if (minutes <= 1) return "moins d’1 min";
  const hours = Math.floor(minutes / 60),
    rest = minutes % 60;
  return hours ? `${hours} h${rest ? ` ${rest} min` : ""}` : `${minutes} min`;
}
