# Hermes Hub

Hermes Hub is a personal information hub powered by Hermes.

Phase 1 scope is intentionally narrow:

- a modular application shell for future Hermes domains
- a real Home page
- a production Expenses module under `Finance > Expenses`
- authenticated, idempotent expense ingestion
- lightweight placeholders for News, Reports, Activity, and Search

## Product direction

Hermes is expected to collect, summarize, monitor, and structure personal information over time.

This app is the durable visual home for that information.

Current production domain:

- Finance
  - Expenses

Future domains already accounted for in the architecture:

- News
- Reports
- Activity
- Search

## Stack

- Next.js 16
- React 19
- TypeScript
- Node built-in SQLite via `node:sqlite`

No ORM and no charting library are used in Phase 1. The current scope does not need them.

## Repository structure

```text
src/
  app/
    (hub)/
      page.tsx
      finance/page.tsx
      finance/expenses/page.tsx
      news/page.tsx
      reports/page.tsx
      activity/page.tsx
      search/page.tsx
    api/ingest/
      expenses/route.ts
      reports/route.ts
      news/route.ts
      events/route.ts
  features/
    hermes/
      types.ts
    expenses/
      server/
      types.ts
  components/
    hub/
    ui/
  lib/
    auth/
    db/
    format/
    ingestion/
```

## Local setup

```bash
npm install
npm run db:seed
npm run dev
```

App URL:

```text
http://localhost:3000
```

## Environment

Create a local `.env.local` file:

```bash
HERMES_INGEST_TOKEN=replace-me
```

Optional:

```bash
HERMES_HUB_DB_PATH=/absolute/path/to/hermes-hub.db
```

If `HERMES_HUB_DB_PATH` is not set, the app uses `data/hermes-hub.db`.

## Commands

```bash
npm run dev
npm run db:seed
npm test
npm run typecheck
npm run lint
npm run build
```

## Current routes

- `/`
- `/finance`
- `/finance/expenses`
- `/news`
- `/reports`
- `/activity`
- `/search`

## Validation status

Validated locally on August 16, 2026:

- `npm run db:seed`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Expense ingestion

See [docs/expenses-ingestion.md](docs/expenses-ingestion.md).
