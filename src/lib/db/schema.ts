export const schemaSql = `
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

CREATE INDEX IF NOT EXISTS idx_expenses_occurred_at ON expenses(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_merchant_id ON expenses(merchant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_ingestion_key ON expenses(ingestion_key);

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
`;
