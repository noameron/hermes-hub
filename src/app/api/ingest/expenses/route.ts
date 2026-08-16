import { NextResponse } from "next/server";

import { HermesAuthError, requireHermesToken } from "@/lib/auth/hermes";
import { jsonError } from "@/lib/ingestion/http";
import { ingestExpenses } from "@/features/expenses/server/repository";
import { parseExpensePayload } from "@/features/expenses/server/validation";

export async function POST(request: Request) {
  try {
    requireHermesToken(request);

    const idempotencyKey = request.headers.get("x-idempotency-key")?.trim();

    if (!idempotencyKey) {
      return jsonError(400, "missing_idempotency_key", "Missing x-idempotency-key header.");
    }

    const sourceHeader = request.headers.get("x-hermes-source")?.trim();
    const payload = parseExpensePayload(await request.json());
    const source = sourceHeader || payload.source || "hermes";

    const result = ingestExpenses(payload, {
      source,
      idempotencyKey,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json(result, {
      status: result.duplicateRequest ? 200 : 201,
    });
  } catch (error) {
    if (error instanceof HermesAuthError) {
      return jsonError(401, "unauthorized", error.message);
    }

    if (error instanceof SyntaxError) {
      return jsonError(400, "invalid_json", "Request body must be valid JSON.");
    }

    if (error instanceof Error) {
      return jsonError(400, "invalid_payload", error.message);
    }

    return jsonError(500, "internal_error", "Unexpected server error.");
  }
}
