import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { poiCategories, poiStatuses } from "../src/lib/poi.ts";
const require = createRequire(import.meta.url);
const { inspectPng } = require("../scripts/poi/png-inspect.cjs");
test("all seven production illustrations have real transparent corners and rich color detail", () => {
  const hashes = new Set<string>();
  for (const category of poiCategories) {
    const bytes = readFileSync(
      new URL(`../assets/poi/illustrated/${category}.png`, import.meta.url),
    );
    const stats = inspectPng(bytes);
    assert.ok(stats.width >= 512 && stats.height >= 512, category);
    assert.ok(
      stats.corners.every((value: number) => value <= 1),
      category,
    );
    assert.ok(stats.transparent > stats.width * stats.height * 0.05, category);
    assert.ok(stats.solid > stats.width * stats.height * 0.25, category);
    assert.ok(stats.sampledColors > 1000, category);
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
  }
  assert.equal(hashes.size, 7);
});
test("review and discovery are separate reusable transparent PNG layers", () => {
  const files = [
    ...poiStatuses.map((status) => `review/${status}`),
    ...["undiscovered", "discovered", "completed"].map(
      (state) => `discovery/${state}`,
    ),
  ];
  const hashes = new Set<string>();
  for (const file of files) {
    const bytes = readFileSync(
      new URL(`../assets/poi/${file}.png`, import.meta.url),
    );
    const stats = inspectPng(bytes);
    assert.equal(stats.width, 72);
    assert.equal(stats.height, 72);
    assert.ok(stats.transparent > 0, file);
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
  }
  assert.equal(hashes.size, files.length);
});
