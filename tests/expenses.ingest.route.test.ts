import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { resetDbConnectionForTests } from "@/lib/db/client";
import { POST } from "@/app/api/ingest/expenses/route";

function makeTempDbPath() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "hermes-hub-test-"));
  return path.join(tempDir, "hub.db");
}

test.afterEach(() => {
  delete process.env.HERMES_INGEST_TOKEN;
  delete process.env.HERMES_HUB_DB_PATH;
  resetDbConnectionForTests();
});

test("expense ingest route requires auth", async () => {
  process.env.HERMES_INGEST_TOKEN = "secret";
  process.env.HERMES_HUB_DB_PATH = makeTempDbPath();

  const response = await POST(
    new Request("http://localhost/api/ingest/expenses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-idempotency-key": "ingest-1",
      },
      body: JSON.stringify({
        expenses: [
          {
            externalId: "tx-1",
            amountAgorot: 5000,
            occurredAt: "2026-08-16T08:00:00.000Z",
            description: "Lunch",
            category: "Dining",
            merchant: "Wolt",
          },
        ],
      }),
    }),
  );

  assert.equal(response.status, 401);
});

test("expense ingest route is idempotent", async () => {
  process.env.HERMES_INGEST_TOKEN = "secret";
  process.env.HERMES_HUB_DB_PATH = makeTempDbPath();

  const requestInit = {
    method: "POST",
    headers: {
      authorization: "Bearer secret",
      "content-type": "application/json",
      "x-idempotency-key": "ingest-1",
      "x-hermes-source": "bank-feed",
    },
    body: JSON.stringify({
      expenses: [
        {
          externalId: "tx-1",
          amountAgorot: 5000,
          occurredAt: "2026-08-16T08:00:00.000Z",
          description: "Lunch",
          category: "Dining",
          merchant: "Wolt",
        },
      ],
    }),
  } satisfies RequestInit;

  const firstResponse = await POST(new Request("http://localhost/api/ingest/expenses", requestInit));
  const secondResponse = await POST(new Request("http://localhost/api/ingest/expenses", requestInit));

  const firstBody = (await firstResponse.json()) as { inserted: number; duplicateRequest: boolean };
  const secondBody = (await secondResponse.json()) as { inserted: number; duplicateRequest: boolean };

  assert.equal(firstResponse.status, 201);
  assert.equal(firstBody.inserted, 1);
  assert.equal(firstBody.duplicateRequest, false);
  assert.equal(secondResponse.status, 200);
  assert.equal(secondBody.inserted, 1);
  assert.equal(secondBody.duplicateRequest, true);
});
