# Summary

- Problem: Reframe the product from a single-purpose expense dashboard into Hermes Hub, a long-lived personal information hub with Expenses as the first production module.
- Decision: Build a modular Next.js application shell with domain-oriented routes, shared ingestion infrastructure, typed expense models, and lightweight placeholders for future Hermes domains.
- Status: implemented

## Goals

- Make the app feel like a personal command center, not an admin panel.
- Fully implement `Finance > Expenses` in Phase 1.
- Keep future Hermes domains possible without rebuilding the app shell or database.
- Reuse shared concerns only where there is already a concrete need, mainly ingestion, layout, and shared UI primitives.

## Non-goals for Phase 1

- No full report reader.
- No cross-domain search engine.
- No ingestion implementation beyond expenses.
- No generic schema system for arbitrary Hermes data.

## Product structure

Top-level navigation:

- Home
- Finance
  - Expenses
- News
- Reports
- Activity
- Search

Phase 1 ships:

- A real Home overview page
- A full Expenses experience under `Finance > Expenses`
- Placeholder pages for News, Reports, Activity, and Search

## Application architecture

Use a modular app layout:

```text
src/
  app/
    (hub)/
      layout.tsx
      page.tsx
      finance/expenses/page.tsx
      news/page.tsx
      reports/page.tsx
      activity/page.tsx
      search/page.tsx
    api/
      ingest/
        expenses/route.ts
        reports/route.ts
        news/route.ts
        events/route.ts
  features/
    home/
    expenses/
      components/
      lib/
      server/
      types/
    reports/
    news/
    activity/
    search/
  components/
    hub/
    ui/
  lib/
    db/
    ingestion/
    auth/
    format/
```

Rules:

- Domain code lives in `features/<domain>`.
- Shared code stays small and concrete.
- Placeholder domains only get enough code to render the shell and prove the route structure.

## Domain model

Phase 1 tables:

- `expense_categories`
- `merchants`
- `expenses`
- `ingestion_runs`
- `ingested_records`
- `hermes_artifacts`
- `hermes_events`

Phase 1 typed expense entities:

- `Expense`
  - amount in agorot
  - currency, default `ILS`
  - occurredAt
  - description
  - merchantId
  - categoryId
  - source
  - externalId
  - ingestionKey
- `ExpenseCategory`
  - slug
  - name
  - color
- `Merchant`
  - normalizedName
  - displayName

Minimal future-facing entities:

- `HermesArtifact`
  - kind
  - title
  - summary
  - content
  - source
  - tags
  - metadata JSON
  - generatedAt
- `HermesEvent`
  - kind
  - title
  - payload JSON
  - source
  - occurredAt

Design intent:

- Expenses get strong analytics-friendly structure.
- Future Hermes data gets minimal generic persistence, not a speculative universal schema.
- Unified search later can index across expenses, artifacts, and events without a database rewrite.

## Ingestion architecture

Shared ingestion concerns:

- bearer-token authentication
- source identification
- request timestamping
- idempotency via request key and per-record external key
- schema validation
- structured error responses
- ingestion run logging

Planned route shape:

- `POST /api/ingest/expenses`, implemented in Phase 1
- `POST /api/ingest/reports`, placeholder
- `POST /api/ingest/news`, placeholder
- `POST /api/ingest/events`, placeholder

Phase 1 only implements the expense flow end to end.

## Home page

The Home page is a personal overview, not a second expense dashboard. It should show:

- current week spending
- week-over-week change
- largest expense category
- recent expenses
- latest Hermes activity placeholder
- latest report and news placeholder

## Testing

Phase 1 coverage:

- unit tests for expense analytics helpers
- API tests for expense ingestion auth, validation, and idempotency
- rendering tests for Home and Expenses states

## Delivery plan

1. Scaffold the repo and app shell.
2. Implement shared database and ingestion foundations.
3. Implement expense persistence, seed data, analytics, and UI.
4. Add Home overview wired to expense summaries.
5. Add placeholder future routes.
6. Add tests, docs, and validation commands.
