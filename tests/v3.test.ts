import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  initializeProgress,
  loadProgress,
  recordDiscovery,
  type ProgressDB,
} from "../src/lib/progress.ts";
import { viewportGroups } from "../src/lib/mapViewport.ts";
import { achievements } from "../src/lib/achievements.ts";
function adapter(native: DatabaseSync): ProgressDB {
  const db: ProgressDB = {
    execAsync: async (sql) => {
      native.exec(sql);
    },
    runAsync: async (sql, ...params) => native.prepare(sql).run(...params),
    getAllAsync: async <T>(sql: string) => native.prepare(sql).all() as T[],
    withExclusiveTransactionAsync: async (body) => {
      native.exec("BEGIN IMMEDIATE");
      try {
        await body(db);
        native.exec("COMMIT");
      } catch (error) {
        native.exec("ROLLBACK");
        throw error;
      }
    },
  };
  return db;
}
test("SQLite migrates once, retains timestamps and XP, and rejects a double reward", async () => {
  const native = new DatabaseSync(":memory:");
  const db = adapter(native);
  const catalogue = [
    { id: "auguste", xp: 120 },
    { id: "cybele", xp: 100 },
  ];
  await initializeProgress(
    db,
    async () => JSON.stringify({ auguste: 1800000000000 }),
    catalogue,
  );
  assert.deepEqual(await loadProgress(db), {
    journal: { auguste: 1800000000000 },
    xp: 120,
  });
  await initializeProgress(
    db,
    async () => {
      throw Error("Legacy unavailable");
    },
    catalogue,
  );
  await recordDiscovery(db, "cybele", 1800000000001, 100);
  await assert.rejects(recordDiscovery(db, "cybele", 1800000000002, 100));
  assert.equal((await loadProgress(db)).xp, 220);
  native.close();
});
test("corrupt migration is rolled back and can be retried without deleting the backup", async () => {
  const native = new DatabaseSync(":memory:");
  const db = adapter(native);
  await assert.rejects(
    initializeProgress(db, async () => "{bad", [{ id: "auguste", xp: 120 }]),
  );
  assert.deepEqual(await db.getAllAsync("SELECT * FROM progress_meta"), []);
  await initializeProgress(db, async () => '{"auguste":1800000000000}', [
    { id: "auguste", xp: 120 },
  ]);
  assert.equal((await loadProgress(db)).xp, 120);
  native.close();
});
test("viewport groups close points, excludes distant points, separates them on zoom", () => {
  const points = [
    { id: "a", latitude: 45.52, longitude: 4.87 },
    { id: "b", latitude: 45.5201, longitude: 4.8701 },
    { id: "lyon", latitude: 45.76, longitude: 4.82 },
  ];
  const region = {
    latitude: 45.52,
    longitude: 4.87,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };
  assert.equal(viewportGroups(points, region, 400, 800).length, 1);
  assert.equal(
    viewportGroups(
      points,
      { ...region, latitudeDelta: 0.0003, longitudeDelta: 0.0003 },
      400,
      800,
    ).length,
    2,
  );
});
test("source-reviewed catalogue has unique identities and valid coordinates", () => {
  const rows = JSON.parse(
    readFileSync(
      new URL("../src/data/generated/heritage.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(rows.length, 27);
  assert.equal(new Set(rows.map((r: { id: string }) => r.id)).size, 27);
  for (const row of rows) {
    assert.ok(row.latitude > 45 && row.latitude < 46);
    assert.ok(row.longitude > 4 && row.longitude < 6);
    assert.equal(row.review.status, "approved");
    assert.ok(
      row.sourceRefs.some(
        (r: { provider: string }) => r.provider === "Wikidata",
      ),
    );
    assert.ok(row.coordinateSource.url.startsWith("https://"));
  }
  const badges = achievements(
    Object.fromEntries(rows.map((r: { id: string }) => [r.id, 1])),
    rows,
  );
  assert.equal(badges.find((b) => b.id === "vienne")!.value, 0);
  assert.equal(badges.find((b) => b.id === "rome")!.value, 0);
});

test("SQLite discoveries survive closing and reopening the database", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const folder = mkdtempSync(join(tmpdir(), "vestige-progress-test-"));
  let native = new DatabaseSync(join(folder, "progress.db"));
  try {
    const catalogue = [{ id: "auguste", xp: 120 }];
    await initializeProgress(adapter(native), async () => null, catalogue);
    await recordDiscovery(adapter(native), "auguste", 1800000000000, 120);
    native.close();
    native = new DatabaseSync(join(folder, "progress.db"));
    const restored = await loadProgress(adapter(native));
    assert.deepEqual(restored, {
      journal: { auguste: 1800000000000 },
      xp: 120,
    });
    await assert.rejects(
      recordDiscovery(adapter(native), "auguste", 1800000000001, 120),
    );
  } finally {
    native.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
