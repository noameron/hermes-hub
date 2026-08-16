import type { DatabaseSync } from "node:sqlite";

import { getDb } from "@/lib/db/client";
import { withTransaction } from "@/lib/db/transaction";
import { addDays, startOfPreviousWeek, startOfWeek } from "@/lib/time";
import {
  buildInsights,
  filterByWindow,
  sumExpenses,
  toCategoryBreakdown,
  toDailySpend,
  toWeeklyTrend,
} from "@/features/expenses/server/analytics";
import type {
  ExpenseDashboardData,
  ExpenseFilterRange,
  ExpenseFilters,
  ExpenseRecord,
} from "@/features/expenses/types";
import type { ExpenseIngestPayload } from "@/features/expenses/server/validation";

type HomeOverviewData = {
  currentWeekSpend: number;
  previousWeekSpend: number;
  weekChange: number | null;
  topCategory: {
    name: string;
    amountAgorot: number;
    share: number;
  } | null;
  recentExpenses: ExpenseRecord[];
  latestActivity: {
    title: string;
    occurredAt: string;
  } | null;
};

type IngestExpenseResult = {
  duplicateRequest: boolean;
  source: string;
  received: number;
  inserted: number;
  skipped: number;
  ingestionKey: string;
};

const baseExpenseSelect = `
  SELECT
    expenses.id AS id,
    expenses.external_id AS externalId,
    expenses.source AS source,
    expenses.account_name AS accountName,
    expenses.amount_agorot AS amountAgorot,
    expenses.currency AS currency,
    expenses.description AS description,
    expenses.occurred_at AS occurredAt,
    expense_categories.name AS categoryName,
    expense_categories.slug AS categorySlug,
    expense_categories.color AS categoryColor,
    merchants.display_name AS merchantName
  FROM expenses
  JOIN expense_categories ON expense_categories.id = expenses.category_id
  LEFT JOIN merchants ON merchants.id = expenses.merchant_id
  ORDER BY expenses.occurred_at DESC, expenses.id DESC
`;

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeMerchantName(value: string) {
  return normalizeText(value).toLowerCase();
}

function slugify(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function colorForCategory(slug: string) {
  const palette = [
    "#7c3aed",
    "#2563eb",
    "#0f766e",
    "#c2410c",
    "#be123c",
    "#4f46e5",
    "#15803d",
    "#a21caf",
  ];

  let hash = 0;

  for (const char of slug) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return palette[hash % palette.length];
}

function isUniqueConstraint(error: unknown) {
  return error instanceof Error && error.message.includes("UNIQUE constraint failed");
}

function ensureCategory(db: DatabaseSync, name: string) {
  const normalizedName = normalizeText(name);
  const slug = slugify(normalizedName);
  const existing = db.prepare("SELECT id FROM expense_categories WHERE slug = ?").get(slug) as
    | { id: number }
    | undefined;

  if (existing) {
    return existing.id;
  }

  const result = db
    .prepare("INSERT INTO expense_categories (slug, name, color) VALUES (?, ?, ?)")
    .run(slug, normalizedName, colorForCategory(slug));

  return Number(result.lastInsertRowid);
}

function ensureMerchant(db: DatabaseSync, name: string) {
  const displayName = normalizeText(name);
  const normalizedName = normalizeMerchantName(name);
  const existing = db.prepare("SELECT id FROM merchants WHERE normalized_name = ?").get(normalizedName) as
    | { id: number }
    | undefined;

  if (existing) {
    return existing.id;
  }

  const result = db
    .prepare("INSERT INTO merchants (normalized_name, display_name) VALUES (?, ?)")
    .run(normalizedName, displayName);

  return Number(result.lastInsertRowid);
}

function mapFilters(input?: Partial<Record<string, string | string[] | undefined>>): ExpenseFilters {
  const query = typeof input?.q === "string" ? input.q.trim() : "";
  const category = typeof input?.category === "string" ? input.category.trim() : "";
  const merchant = typeof input?.merchant === "string" ? input.merchant.trim() : "";
  const rangeCandidate = typeof input?.range === "string" ? input.range.trim() : "";
  const range: ExpenseFilterRange =
    rangeCandidate === "7d" || rangeCandidate === "30d" || rangeCandidate === "90d" || rangeCandidate === "all"
      ? rangeCandidate
      : "30d";

  return { query, category, merchant, range };
}

function applyRange(rows: ExpenseRecord[], range: ExpenseFilterRange) {
  if (range === "all") {
    return rows;
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const threshold = addDays(new Date(), -(days - 1)).getTime();

  return rows.filter((row) => new Date(row.occurredAt).getTime() >= threshold);
}

function applyFilters(rows: ExpenseRecord[], filters: ExpenseFilters) {
  const query = filters.query.toLowerCase();
  const category = filters.category.toLowerCase();
  const merchant = filters.merchant.toLowerCase();

  return applyRange(rows, filters.range).filter((row) => {
    if (query) {
      const haystack = [row.description, row.categoryName, row.merchantName ?? "", row.accountName ?? ""]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (category && row.categorySlug !== category) {
      return false;
    }

    if (merchant && normalizeMerchantName(row.merchantName ?? "") !== merchant) {
      return false;
    }

    return true;
  });
}

export function listExpenses() {
  const db = getDb();
  return db.prepare(baseExpenseSelect).all() as ExpenseRecord[];
}

export function getExpenseDashboardData(input?: Partial<Record<string, string | string[] | undefined>>): ExpenseDashboardData {
  const rows = listExpenses();
  const filters = mapFilters(input);
  const visibleRows = applyFilters(rows, filters);
  const currentWeekRows = filterByWindow(visibleRows, startOfWeek(new Date()), addDays(startOfWeek(new Date()), 7));
  const previousWeekRows = filterByWindow(
    visibleRows,
    startOfPreviousWeek(new Date()),
    startOfWeek(new Date()),
  );
  const currentWeek = sumExpenses(currentWeekRows);
  const previousWeek = sumExpenses(previousWeekRows);
  const categoryBreakdown = toCategoryBreakdown(visibleRows);
  const topCategory = categoryBreakdown[0] ?? null;

  return {
    filters,
    totals: {
      currentWeek,
      previousWeek,
      weekChange: previousWeek === 0 ? null : (currentWeek - previousWeek) / previousWeek,
      averageTransaction: visibleRows.length === 0 ? 0 : Math.round(sumExpenses(visibleRows) / visibleRows.length),
      totalTransactions: visibleRows.length,
      topCategory: topCategory
        ? {
            name: topCategory.name,
            amountAgorot: topCategory.amountAgorot,
            share: topCategory.share,
          }
        : null,
    },
    weeklyTrend: toWeeklyTrend(visibleRows),
    categoryBreakdown,
    dailySpend: toDailySpend(visibleRows),
    recentExpenses: visibleRows.slice(0, 6),
    allExpenses: visibleRows,
    categories: Array.from(new Map(rows.map((row) => [row.categorySlug, row.categoryName])).entries()).map(
      ([value, label]) => ({ value, label }),
    ),
    merchants: Array.from(
      new Map(
        rows
          .filter((row) => row.merchantName)
          .map((row) => [normalizeMerchantName(row.merchantName ?? ""), row.merchantName ?? ""]),
      ).entries(),
    ).map(([value, label]) => ({ value, label })),
    insights: buildInsights(visibleRows),
  };
}

export function getHomeOverviewData(): HomeOverviewData {
  const rows = listExpenses();
  const currentWeekRows = filterByWindow(rows, startOfWeek(new Date()), addDays(startOfWeek(new Date()), 7));
  const previousWeekRows = filterByWindow(rows, startOfPreviousWeek(new Date()), startOfWeek(new Date()));
  const categoryBreakdown = toCategoryBreakdown(currentWeekRows.length === 0 ? rows : currentWeekRows);
  const latestEvent = getDb()
    .prepare("SELECT title, occurred_at AS occurredAt FROM hermes_events ORDER BY occurred_at DESC, id DESC LIMIT 1")
    .get() as { title: string; occurredAt: string } | undefined;

  const currentWeekSpend = sumExpenses(currentWeekRows);
  const previousWeekSpend = sumExpenses(previousWeekRows);

  return {
    currentWeekSpend,
    previousWeekSpend,
    weekChange: previousWeekSpend === 0 ? null : (currentWeekSpend - previousWeekSpend) / previousWeekSpend,
    topCategory: categoryBreakdown[0]
      ? {
          name: categoryBreakdown[0].name,
          amountAgorot: categoryBreakdown[0].amountAgorot,
          share: categoryBreakdown[0].share,
        }
      : null,
    recentExpenses: rows.slice(0, 5),
    latestActivity: latestEvent ?? null,
  };
}

export function ingestExpenses(
  payload: ExpenseIngestPayload,
  context: {
    source: string;
    idempotencyKey: string;
    receivedAt: string;
  },
): IngestExpenseResult {
  const db = getDb();

  return withTransaction(db, () => {
    let ingestionRunId: number;

    try {
      const result = db
        .prepare(
          `
            INSERT INTO ingestion_runs (domain, source, idempotency_key, received_at, status, records_received)
            VALUES ('expenses', ?, ?, ?, 'processing', ?)
          `,
        )
        .run(context.source, context.idempotencyKey, context.receivedAt, payload.expenses.length);
      ingestionRunId = Number(result.lastInsertRowid);
    } catch (error) {
      if (!isUniqueConstraint(error)) {
        throw error;
      }

      const existing = db
        .prepare(
          `
            SELECT response_json AS responseJson
            FROM ingestion_runs
            WHERE domain = 'expenses' AND source = ? AND idempotency_key = ?
          `,
        )
        .get(context.source, context.idempotencyKey) as { responseJson: string | null } | undefined;

      if (!existing?.responseJson) {
        throw error;
      }

      return {
        ...(JSON.parse(existing.responseJson) as Omit<IngestExpenseResult, "duplicateRequest">),
        duplicateRequest: true,
      };
    }

    try {
      let inserted = 0;

      for (const expense of payload.expenses) {
        const existingRecord = db
          .prepare(
            `
              SELECT id
              FROM ingested_records
              WHERE domain = 'expenses' AND source = ? AND external_id = ?
            `,
          )
          .get(context.source, expense.externalId) as { id: number } | undefined;

        if (existingRecord) {
          continue;
        }

        const categoryId = ensureCategory(db, expense.category);
        const merchantId = ensureMerchant(db, expense.merchant);
        const expenseResult = db
          .prepare(
            `
              INSERT INTO expenses (
                external_id,
                source,
                account_name,
                amount_agorot,
                currency,
                description,
                occurred_at,
                category_id,
                merchant_id,
                ingestion_key
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
          )
          .run(
            expense.externalId,
            context.source,
            expense.accountName,
            expense.amountAgorot,
            expense.currency,
            expense.description,
            expense.occurredAt,
            categoryId,
            merchantId,
            context.idempotencyKey,
          );

        db.prepare(
          `
            INSERT INTO ingested_records (domain, source, external_id, entity_table, entity_id, payload_json, ingested_at)
            VALUES ('expenses', ?, ?, 'expenses', ?, ?, ?)
          `,
        ).run(
          context.source,
          expense.externalId,
          Number(expenseResult.lastInsertRowid),
          JSON.stringify(expense),
          context.receivedAt,
        );

        inserted += 1;
      }

      db.prepare(
        `
          INSERT INTO hermes_events (kind, title, payload_json, source, occurred_at)
          VALUES ('expense-ingestion', ?, ?, ?, ?)
        `,
      ).run(
        `Expense batch from ${context.source}`,
        JSON.stringify({
          received: payload.expenses.length,
          inserted,
          idempotencyKey: context.idempotencyKey,
        }),
        context.source,
        context.receivedAt,
      );

      const response: Omit<IngestExpenseResult, "duplicateRequest"> = {
        source: context.source,
        received: payload.expenses.length,
        inserted,
        skipped: payload.expenses.length - inserted,
        ingestionKey: context.idempotencyKey,
      };

      db.prepare(
        `
          UPDATE ingestion_runs
          SET status = 'success',
              records_inserted = ?,
              response_json = ?
          WHERE id = ?
        `,
      ).run(inserted, JSON.stringify(response), ingestionRunId);

      return {
        duplicateRequest: false,
        ...response,
      };
    } catch (error) {
      db.prepare(
        `
          UPDATE ingestion_runs
          SET status = 'failed',
              error_json = ?
          WHERE id = ?
        `,
      ).run(JSON.stringify({ message: error instanceof Error ? error.message : "Unknown error" }), ingestionRunId);
      throw error;
    }
  });
}
