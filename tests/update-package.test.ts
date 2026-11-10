import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const entries = JSON.parse(
  readFileSync(
    new URL("scripts/windows/social-v2-update-files.json", root),
    "utf8",
  ),
) as { path: string; sha256: string }[];
const paths = new Set(entries.map((e) => e.path));
function sources(directory: string): string[] {
  return readdirSync(new URL(directory + "/", root), {
    withFileTypes: true,
  }).flatMap((entry) =>
    entry.isDirectory()
      ? sources(directory + "/" + entry.name)
      : [directory + "/" + entry.name],
  );
}
test("Windows cumulative patch contains unchanged V1 POI dependencies, not just V2 differences", () => {
  const required = [
    "src/components/exploration/PoiClusterMarker.tsx",
    "src/components/exploration/HistoricalMarker.tsx",
    "src/components/exploration/MapOptions.tsx",
    "src/lib/poi.ts",
    "src/lib/mapViewport.ts",
    "src/data/monuments.ts",
    "src/data/imported-pois.json",
    "src/app/monument/[id].tsx",
    ...sources("src/components/poi"),
    ...sources("src/components/contributions"),
    ...sources("src/lib/contributions"),
  ];
  for (const file of required)
    assert.ok(paths.has(file), `Missing update dependency: ${file}`);
});
test("every Windows patch file exists and matches its published checksum", () => {
  assert.equal(paths.size, entries.length, "duplicate patch entries");
  for (const entry of entries) {
    assert.ok(
      !entry.path.startsWith("/") && !entry.path.split("/").includes(".."),
    );
    assert.equal(
      createHash("sha256")
        .update(readFileSync(new URL(entry.path, root)))
        .digest("hex"),
      entry.sha256,
      entry.path,
    );
  }
});
