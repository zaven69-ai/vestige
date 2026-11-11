// Optional live integration check: public fixed test points, never personal GPS.
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { fetchWalkingRoute } from "../../src/lib/navigation/walking.ts";
const temple = { latitude: 45.525698, longitude: 4.874218 },
  cybele = { latitude: 45.524969, longitude: 4.875451 },
  theatre = { latitude: 45.524787, longitude: 4.878314 },
  lyon = { latitude: 45.7578, longitude: 4.832 };
const cases = [
  ["lyon-temple", lyon, temple],
  ["temple-cybele", temple, cybele],
  ["cybele-theatre", cybele, theatre],
];
const results = [];
for (const [id, start, target] of cases) {
  let rawResponse = "";
  const capture = async (url) => {
    const text = execFileSync(
      "curl",
      ["-L", "--fail-with-body", "-sS", "--max-time", "30", url],
      { encoding: "utf8", maxBuffer: 2000000 },
    );
    rawResponse = text;
    return { ok: true, status: 200, text: async () => text };
  };
  const data = await fetchWalkingRoute(
    start,
    target,
    new AbortController().signal,
    capture,
  );
  results.push({
    id,
    start,
    target,
    meters: data.meters,
    seconds: data.seconds,
    vertices: data.coordinates.length,
    instructions: data.maneuvers.map((m) => m.instruction),
    checkedAt: new Date().toISOString(),
    provider: data.provider,
  });
  console.log(
    id,
    data.meters,
    "m",
    data.seconds,
    "s",
    data.coordinates.length,
    "points",
    data.maneuvers.length,
    "instructions",
  );
  if (process.argv.includes("--fixtures")) {
    mkdirSync("tests/fixtures/navigation", { recursive: true });
    writeFileSync(
      `tests/fixtures/navigation/${id}.json`,
      JSON.stringify(JSON.parse(rawResponse), null, 2) + "\n",
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 1100));
}
mkdirSync("docs/navigation", { recursive: true });
writeFileSync(
  "docs/navigation/valhalla-live-check.json",
  JSON.stringify(results, null, 2) + "\n",
);
