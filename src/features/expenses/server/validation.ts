type RawExpenseInput = Record<string, unknown>;

export type ExpenseIngestInput = {
  externalId: string;
  occurredAt: string;
  amountAgorot: number;
  currency: string;
  description: string;
  category: string;
  merchant: string;
  accountName: string | null;
};

export type ExpenseIngestPayload = {
  source?: string;
  expenses: ExpenseIngestInput[];
};

function readString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string.`);
  }

  return value.trim();
}

function readOptionalString(value: unknown) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Optional string field must be a string when present.");
  }

  return value.trim();
}

function readAmountAgorot(input: RawExpenseInput) {
  if (typeof input.amountAgorot === "number" && Number.isInteger(input.amountAgorot)) {
    return input.amountAgorot;
  }

  if (typeof input.amount === "number" && Number.isFinite(input.amount)) {
    return Math.round(input.amount * 100);
  }

  throw new Error("amountAgorot or amount must be provided.");
}

export function parseExpensePayload(payload: unknown): ExpenseIngestPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload must be a JSON object.");
  }

  const candidate = payload as Record<string, unknown>;

  if (!Array.isArray(candidate.expenses) || candidate.expenses.length === 0) {
    throw new Error("Payload must include a non-empty expenses array.");
  }

  const expenses = candidate.expenses.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Expense at index ${index} must be an object.`);
    }

    const record = item as RawExpenseInput;

    const occurredAt = readString(record.occurredAt, `expenses[${index}].occurredAt`);

    if (Number.isNaN(Date.parse(occurredAt))) {
      throw new Error(`expenses[${index}].occurredAt must be a valid ISO date.`);
    }

    return {
      externalId: readString(record.externalId, `expenses[${index}].externalId`),
      occurredAt: new Date(occurredAt).toISOString(),
      amountAgorot: readAmountAgorot(record),
      currency: typeof record.currency === "string" ? record.currency.trim().toUpperCase() : "ILS",
      description: readString(record.description, `expenses[${index}].description`),
      category: readString(record.category, `expenses[${index}].category`),
      merchant: readString(record.merchant, `expenses[${index}].merchant`),
      accountName: readOptionalString(record.accountName),
    };
  });

  const source =
    typeof candidate.source === "string" && candidate.source.trim().length > 0
      ? candidate.source.trim()
      : undefined;

  return { source, expenses };
}
