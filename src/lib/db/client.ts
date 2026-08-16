import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { schemaSql } from "@/lib/db/schema";

declare global {
  var hermesDb: DatabaseSync | undefined;
  var hermesDbInitialized: boolean | undefined;
  var hermesDbPath: string | undefined;
}

function resolveDatabasePath() {
  return process.env.HERMES_HUB_DB_PATH ?? path.join(process.cwd(), "data", "hermes-hub.db");
}

function openDatabase() {
  const databasePath = resolveDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  return db;
}

export function getDb() {
  const databasePath = resolveDatabasePath();

  if (globalThis.hermesDb && globalThis.hermesDbPath !== databasePath) {
    globalThis.hermesDb.close?.();
    globalThis.hermesDb = undefined;
    globalThis.hermesDbInitialized = false;
  }

  if (!globalThis.hermesDb) {
    globalThis.hermesDb = openDatabase();
    globalThis.hermesDbPath = databasePath;
  }

  if (!globalThis.hermesDbInitialized) {
    globalThis.hermesDb.exec(schemaSql);
    globalThis.hermesDbInitialized = true;
  }

  return globalThis.hermesDb;
}

export function resetDbConnectionForTests() {
  globalThis.hermesDb?.close?.();
  globalThis.hermesDb = undefined;
  globalThis.hermesDbInitialized = false;
  globalThis.hermesDbPath = undefined;
}
