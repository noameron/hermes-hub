import assert from "node:assert/strict";
import test from "node:test";

import { buildInsights, toCategoryBreakdown, toDailySpend } from "@/features/expenses/server/analytics";
import type { ExpenseRecord } from "@/features/expenses/types";

const sampleRows: ExpenseRecord[] = [
  {
    id: 1,
    externalId: "1",
    source: "test",
    accountName: "Checking",
    amountAgorot: 1500,
    currency: "ILS",
    description: "Lunch",
    occurredAt: new Date().toISOString(),
    categoryName: "Dining",
    categorySlug: "dining",
    categoryColor: "#c2410c",
    merchantName: "Wolt",
  },
  {
    id: 2,
    externalId: "2",
    source: "test",
    accountName: "Checking",
    amountAgorot: 3500,
    currency: "ILS",
    description: "Groceries",
    occurredAt: new Date().toISOString(),
    categoryName: "Groceries",
    categorySlug: "groceries",
    categoryColor: "#15803d",
    merchantName: "Rami Levy",
  },
];

test("category breakdown ranks by spend and computes share", () => {
  const breakdown = toCategoryBreakdown(sampleRows);

  assert.equal(breakdown[0]?.name, "Groceries");
  assert.equal(breakdown[0]?.amountAgorot, 3500);
  assert.equal(Math.round((breakdown[0]?.share ?? 0) * 100), 70);
});

test("daily spend keeps the requested number of buckets", () => {
  const dailySpend = toDailySpend(sampleRows, 7);
  assert.equal(dailySpend.length, 7);
  assert.equal(dailySpend.at(-1)?.amountAgorot, 5000);
});

test("buildInsights returns deterministic text for non-empty data", () => {
  const insights = buildInsights(sampleRows);
  assert.ok(insights.some((entry) => entry.includes("Top category is Groceries")));
  assert.ok(insights.some((entry) => entry.includes("Largest transaction is Groceries")));
});
