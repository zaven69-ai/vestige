import { openDatabaseAsync } from "expo-sqlite";
import type { ProgressDB } from "./progress";
let database: Promise<ProgressDB> | null = null;
export function progressDatabase() {
  if (!database)
    database = openDatabaseAsync("vestige-progress-v3.db")
      .then((db) => db as unknown as ProgressDB)
      .catch((error) => {
        database = null;
        throw error;
      });
  return database;
}
