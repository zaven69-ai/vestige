import { readJournal } from "./game.ts";
export type ProgressDB = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, ...params: (string | number)[]) => Promise<unknown>;
  getAllAsync: <T>(sql: string) => Promise<T[]>;
  withExclusiveTransactionAsync: (
    body: (transaction: ProgressDB) => Promise<void>,
  ) => Promise<void>;
};
export async function initializeProgress(
  db: ProgressDB,
  legacy: () => Promise<string | null>,
  catalogue: { id: string; xp: number }[],
) {
  await db.execAsync(
    "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS discoveries (id TEXT PRIMARY KEY, discovered_at INTEGER NOT NULL, xp INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS progress_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);",
  );
  await db.withExclusiveTransactionAsync(async (tx) => {
    const flags = await tx.getAllAsync<{ key: string }>(
      "SELECT key FROM progress_meta WHERE key = 'legacy-v1'",
    );
    if (flags.length) return;
    const journal = readJournal(
      await legacy(),
      catalogue.map((m) => m.id),
    );
    for (const [id, date] of Object.entries(journal)) {
      await tx.runAsync(
        "INSERT OR IGNORE INTO discoveries (id, discovered_at, xp) VALUES (?, ?, ?)",
        id,
        date,
        catalogue.find((m) => m.id === id)!.xp,
      );
    }
    await tx.runAsync(
      "INSERT INTO progress_meta (key, value) VALUES (?, ?)",
      "legacy-v1",
      "complete",
    );
  });
}
export async function loadProgress(db: ProgressDB) {
  const rows = await db.getAllAsync<{
    id: string;
    discovered_at: number;
    xp: number;
  }>("SELECT id, discovered_at, xp FROM discoveries");
  return {
    journal: Object.fromEntries(rows.map((row) => [row.id, row.discovered_at])),
    xp: rows.reduce((sum, row) => sum + row.xp, 0),
  };
}
export async function recordDiscovery(
  db: ProgressDB,
  id: string,
  timestamp: number,
  xp: number,
) {
  // Unique primary key prevents repeated XP even after a restart.
  await db.runAsync(
    "INSERT INTO discoveries (id, discovered_at, xp) VALUES (?, ?, ?)",
    id,
    timestamp,
    xp,
  );
}
