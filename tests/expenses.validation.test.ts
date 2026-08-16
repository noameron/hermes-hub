import assert from "node:assert/strict";
import test from "node:test";

import { parseExpensePayload } from "@/features/expenses/server/validation";

test("parseExpensePayload accepts amount and normalizes defaults", () => {
  const payload = parseExpensePayload({
    source: "bank-feed",
    expenses: [
      {
        externalId: "abc-1",
        amount: 42.5,
        occurredAt: "2026-08-14T10:00:00.000Z",
        description: "Coffee",
        category: "Dining",
        merchant: "Cafe Cafe",
      },
    ],
  });

  assert.equal(payload.source, "bank-feed");
  assert.equal(payload.expenses[0]?.amountAgorot, 4250);
  assert.equal(payload.expenses[0]?.currency, "ILS");
});

test("parseExpensePayload rejects missing expenses", () => {
  assert.throws(() => parseExpensePayload({ expenses: [] }), /non-empty expenses array/);
});
