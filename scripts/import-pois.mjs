#!/usr/bin/env node
/**
 * Imports public heritage POIs from OpenStreetMap (Overpass).
 * Run: node scripts/import-pois.mjs
 * Data remains reviewable; missing historical facts and photographs are never invented.
 * © OpenStreetMap contributors, ODbL 1.0: https://www.openstreetmap.org/copyright
 */
import { writeFile } from "node:fs/promises";

const endpoints = process.env.OVERPASS_URL
  ? [process.env.OVERPASS_URL]
  : [
      "https://overpass.private.coffee/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass-api.de/api/interpreter",
    ];
const cities = [
  { city: "Vienne", bbox: [45.47, 4.81, 45.58, 4.96], limit: 300 },
  { city: "Lyon", bbox: [45.69, 4.73, 45.84, 4.94], limit: 700 },
];
// Narrow, named heritage queries to avoid expensive unbounded Overpass scans.
const heritage = [
  '["historic"]["name"]',
  '["heritage"]["name"]',
  '["tourism"~"^(museum|gallery|artwork|attraction)$"]["name"]',
];
const bannedAccess = new Set(["private", "no"]);
const category = (tags) =>
  tags.historic || tags.tourism || tags.heritage || "patrimoine";
function query(bbox) {
  const box = bbox.join(",");
  return '[out:json][timeout:55];(' +
    heritage.map((tag) => "nwr" + tag + "(" + box + ");").join("") +
    ");out center tags;";
}
function tiles([south, west, north, east], rows, columns) {
  const result = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++)
      result.push([
        south + (north - south) * row / rows,
        west + (east - west) * col / columns,
        south + (north - south) * (row + 1) / rows,
        west + (east - west) * (col + 1) / columns,
      ]);
  return result;
}
async function fetchTile(bbox) {
  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Vestige-heritage-import/1.0 (openstreetmap.org/copyright)",
        },
        body: new URLSearchParams({ data: query(bbox) }),
        signal: AbortSignal.timeout(70_000),
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const json = await response.json();
      if (!Array.isArray(json.elements)) throw new Error("Unexpected Overpass response");
      return json.elements;
    } catch (error) {
      lastError = error;
      console.warn("Overpass retry: " + endpoint + " (" + error.message + ")");
    }
  }
  throw lastError || new Error("No Overpass endpoint available");
}
async function fetchCity(area) {
  const pieces = tiles(area.bbox, area.city === "Lyon" ? 3 : 2, area.city === "Lyon" ? 3 : 2);
  const elements = [];
  let successfulTiles = 0;
  for (const [index, bbox] of pieces.entries()) {
    try {
      const chunk = await fetchTile(bbox);
      elements.push(...chunk);
      successfulTiles++;
      console.log(area.city + " zone " + (index + 1) + "/" + pieces.length + ": " + chunk.length + " résultats");
    } catch (error) {
      console.warn(area.city + " zone " + (index + 1) + " ignorée : " + error.message);
    }
  }
  if (!successfulTiles) throw new Error(area.city + ": aucune zone récupérée");
  const unique = [...new Map(elements.map((e) => [e.type + ":" + e.id, e])).values()];
  const rows = [];
  for (const e of unique) {
    const tags = e.tags || {};
    const name = tags["name:fr"] || tags.name;
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (bannedAccess.has(tags.access) || bannedAccess.has(tags["access:foot"])) continue;
    if (tags.disused === "yes" || tags.abandoned === "yes") continue;
    const id = "osm-" + e.type + "-" + e.id;
    const source = "https://www.openstreetmap.org/" + e.type + "/" + e.id;
    const wikipedia = tags.wikipedia?.startsWith("fr:")
      ? "https://fr.wikipedia.org/wiki/" + encodeURIComponent(tags.wikipedia.slice(3).replaceAll(" ", "_"))
      : source;
    const period = tags.start_date || tags["historic:period"] || "";
    const era = /roman|antique|gallo/i.test(period) ? "Antiquité" : "Époque à vérifier";
    rows.push({
      id, name, city: area.city, era, xp: 50,
      latitude: lat, longitude: lon,
      description: "Lieu patrimonial répertorié dans OpenStreetMap. La notice historique détaillée reste à vérifier avant publication.",
      source: wikipedia, photoPage: source,
      attribution: "Données © contributeurs OpenStreetMap · ODbL 1.0 · photographie non disponible",
      image: null, reviewStatus: "pending", category: category(tags), osmUrl: source,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, "fr")).slice(0, area.limit);
}
async function main() {
  const all = [];
  const seen = new Set();
  for (const area of cities) {
    const rows = await fetchCity(area);
    for (const row of rows) {
      if (!seen.has(row.id)) { seen.add(row.id); all.push(row); }
    }
    console.log(area.city + ": " + rows.length + " POI candidats");
  }
  const target = new URL("../src/data/imported-pois.json", import.meta.url);
  await writeFile(target, JSON.stringify(all, null, 2) + "\n");
  console.log("Total " + all.length + " candidats sauvegardés dans " + target.pathname);
  console.log("Attention : validation éditoriale et licences des images encore nécessaires.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
