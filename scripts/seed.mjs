import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = process.env.HERMES_HUB_DB_PATH ?? path.join(process.cwd(), "data", "hermes-hub.db");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  normalized_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  source TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  received_at TEXT NOT NULL,
  status TEXT NOT NULL,
  records_received INTEGER NOT NULL DEFAULT 0,
  records_inserted INTEGER NOT NULL DEFAULT 0,
  response_json TEXT,
  error_json TEXT,
  UNIQUE(domain, source, idempotency_key)
);

CREATE TABLE IF NOT EXISTS ingested_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  entity_table TEXT NOT NULL,
  entity_id INTEGER,
  payload_json TEXT NOT NULL,
  ingested_at TEXT NOT NULL,
  UNIQUE(domain, source, external_id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  account_name TEXT,
  amount_agorot INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ILS',
  description TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES expense_categories(id),
  merchant_id INTEGER REFERENCES merchants(id),
  ingestion_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source, external_id)
);

CREATE TABLE IF NOT EXISTS hermes_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  generated_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hermes_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  source TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

const categories = [
  ["groceries", "Groceries", "#15803d"],
  ["travel", "Travel", "#2563eb"],
  ["dining", "Dining", "#c2410c"],
  ["software", "Software", "#7c3aed"],
  ["wellness", "Wellness", "#be123c"],
  ["utilities", "Utilities", "#0f766e"],
];

const merchants = [
  ["rami-levy", "Rami Levy"],
  ["wolt", "Wolt"],
  ["arkia", "Arkia"],
  ["openai", "OpenAI"],
  ["super-pharm", "Super-Pharm"],
  ["cellcom", "Cellcom"],
  ["cafecafe", "Cafe Cafe"],
  ["bookingcom", "Booking.com"],
];

const now = new Date("2026-08-16T09:00:00.000Z");
const day = 24 * 60 * 60 * 1000;

const records = [
  [-1, "groceries", "rami-levy", "Weekly groceries", 28640, "Checking"],
  [-2, "dining", "wolt", "Team lunch delivery", 12400, "Checking"],
  [-3, "software", "openai", "Hermes platform usage", 9200, "Credit Card"],
  [-4, "wellness", "super-pharm", "Supplements and toiletries", 8400, "Checking"],
  [-5, "utilities", "cellcom", "Mobile plan", 6900, "Checking"],
  [-6, "travel", "bookingcom", "Jerusalem stay", 31800, "Credit Card"],
  [-8, "dining", "cafecafe", "Client breakfast", 9100, "Credit Card"],
  [-9, "groceries", "rami-levy", "Midweek grocery refill", 17600, "Checking"],
  [-10, "software", "openai", "API usage top-up", 11300, "Credit Card"],
  [-12, "travel", "arkia", "Domestic flight", 45200, "Credit Card"],
  [-14, "groceries", "rami-levy", "Shabbat groceries", 24400, "Checking"],
  [-16, "utilities", "cellcom", "Home internet", 7400, "Checking"],
  [-18, "wellness", "super-pharm", "Pharmacy order", 5100, "Checking"],
  [-21, "travel", "bookingcom", "Hotel deposit", 22500, "Credit Card"],
  [-23, "dining", "wolt", "Late dinner", 7800, "Checking"],
  [-25, "software", "openai", "Model experimentation", 9700, "Credit Card"],
  [-28, "groceries", "rami-levy", "Monthly restock", 30300, "Checking"],
  [-31, "travel", "arkia", "Seat selection", 4200, "Credit Card"],
  [-35, "wellness", "super-pharm", "Care products", 6500, "Checking"],
  [-40, "dining", "cafecafe", "Coffee meeting", 5600, "Credit Card"],
  [-45, "groceries", "rami-levy", "Fresh produce", 13900, "Checking"],
  [-52, "software", "openai", "Research run", 12100, "Credit Card"],
];

db.exec("BEGIN IMMEDIATE");

try {
  db.exec("DELETE FROM hermes_events");
  db.exec("DELETE FROM hermes_artifacts");
  db.exec("DELETE FROM ingested_records");
  db.exec("DELETE FROM ingestion_runs");
  db.exec("DELETE FROM expenses");
  db.exec("DELETE FROM merchants");
  db.exec("DELETE FROM expense_categories");

  for (const [slug, name, color] of categories) {
    db.prepare("INSERT INTO expense_categories (slug, name, color) VALUES (?, ?, ?)").run(slug, name, color);
  }

  for (const [normalizedName, displayName] of merchants) {
    db.prepare("INSERT INTO merchants (normalized_name, display_name) VALUES (?, ?)").run(normalizedName, displayName);
  }

  const categoryMap = Object.fromEntries(
    db.prepare("SELECT id, slug FROM expense_categories").all().map((row) => [row.slug, row.id]),
  );
  const merchantMap = Object.fromEntries(
    db.prepare("SELECT id, normalized_name FROM merchants").all().map((row) => [row.normalized_name, row.id]),
  );

  const insertExpense = db.prepare(`
    INSERT INTO expenses (
      external_id, source, account_name, amount_agorot, currency, description, occurred_at, category_id, merchant_id, ingestion_key
    ) VALUES (?, 'seed', ?, ?, 'ILS', ?, ?, ?, ?, 'seed-2026-08-16')
  `);

  for (const [offsetDays, categorySlug, merchantSlug, description, amountAgorot, accountName] of records) {
    const occurredAt = new Date(now.getTime() + offsetDays * day).toISOString();
    insertExpense.run(
      `seed-${String(offsetDays).replace("-", "m")}-${categorySlug}`,
      accountName,
      amountAgorot,
      description,
      occurredAt,
      categoryMap[categorySlug],
      merchantMap[merchantSlug],
    );
  }

  db.prepare(`
    INSERT INTO hermes_events (kind, title, payload_json, source, occurred_at)
    VALUES ('seed', 'Seeded expense dataset', '{"records":22}', 'seed', ?)
  `).run(now.toISOString());

  db.exec("COMMIT");
  console.log(`Seeded Hermes Hub database at ${databasePath}`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
