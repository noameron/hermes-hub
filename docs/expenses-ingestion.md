# Hermes expense ingestion

Phase 1 implements only:

```text
POST /api/ingest/expenses
```

Future endpoints are already reserved:

```text
POST /api/ingest/reports
POST /api/ingest/news
POST /api/ingest/events
```

## Authentication

Use a Bearer token:

```http
Authorization: Bearer <HERMES_INGEST_TOKEN>
```

The server validates against the local `HERMES_INGEST_TOKEN` environment variable.

## Required headers

```http
x-idempotency-key: <stable-request-key>
```

Optional:

```http
x-hermes-source: <producer-name>
```

If `x-hermes-source` is omitted, the API uses `payload.source` and then falls back to `hermes`.

## Payload

```json
{
  "source": "bank-feed",
  "expenses": [
    {
      "externalId": "txn-2026-08-16-001",
      "occurredAt": "2026-08-16T08:30:00.000Z",
      "amountAgorot": 4250,
      "description": "Coffee",
      "category": "Dining",
      "merchant": "Cafe Cafe",
      "accountName": "Checking",
      "currency": "ILS"
    }
  ]
}
```

The API also accepts `amount` as a decimal number and converts it to agorot.

## Success response

First accepted request:

```json
{
  "duplicateRequest": false,
  "source": "bank-feed",
  "received": 1,
  "inserted": 1,
  "skipped": 0,
  "ingestionKey": "batch-2026-08-16-01"
}
```

If the same `x-idempotency-key` is sent again for the same source, the API returns the original result with:

```json
{
  "duplicateRequest": true
}
```

## Idempotency model

Two levels are enforced:

- request-level idempotency via `(domain, source, idempotency_key)`
- record-level idempotency via `(domain, source, external_id)`

That allows safe retries for whole batches and for individual records.

## Example curl

```bash
curl -X POST http://localhost:3000/api/ingest/expenses \
  -H "Authorization: Bearer $HERMES_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: batch-2026-08-16-01" \
  -H "x-hermes-source: bank-feed" \
  -d '{
    "expenses": [
      {
        "externalId": "txn-2026-08-16-001",
        "occurredAt": "2026-08-16T08:30:00.000Z",
        "amountAgorot": 4250,
        "description": "Coffee",
        "category": "Dining",
        "merchant": "Cafe Cafe",
        "accountName": "Checking"
      }
    ]
  }'
```
