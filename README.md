# AfriScout

Africa's Opportunity Intelligence Platform.

Discover Opportunities. Understand Them. Act With Confidence.

AfriScout continuously discovers legitimate public opportunities
across Africa, structures and verifies them, layers AI intelligence
on top, matches them to each user's profile and capabilities,
explains why each match matters, monitors important changes, and
gives users a workspace to prepare for, apply to, and track
opportunities through to outcome.

AfriScout is not a job board, not a tender scraper, and not a
search engine. It is an opportunity intelligence platform.

---

## Platform overview

- Web application (React, TypeScript, Tailwind CSS, Vite, Zustand)
- Backend API (Node.js, Express, TypeScript, Prisma, PostgreSQL)
- Background workers (BullMQ, Redis)
- Discovery and monitoring layer (Apify Actors, Datasets, Schedules, Webhooks)
- AI intelligence layer (provider-agnostic with OpenAI, Anthropic, Gemini, Mock fallback)
- Public API and webhooks for developers and AI agents
- Admin platform for source registry, pipeline monitoring, data quality,
  duplicates, changes, audit logs, and system settings
- Deployment on Render (web service, background worker, static site,
  managed Postgres, managed Redis)

---

## Repository structure

```
afri-scout/
  apps/
    web/     React + Vite + TypeScript + Tailwind web application
    api/     Express + TypeScript API, Prisma, BullMQ workers
  packages/
    shared/  Shared enums, types, validators, Apify IO schemas
    config/  Shared ESLint, TypeScript, Prettier, Tailwind presets
  apify/
    actors/  Independent Apify Actor packages
    schedules/  Schedule notes
  docs/      Architecture, database, API, product, operations, design
  scripts/   Setup, seed, migrations, connectivity checks
```

---

## Requirements

- Node.js 20.11 or later
- npm 10 or later
- Docker and Docker Compose (for local Postgres and Redis)
- An Apify account with an API token (required for real discovery)
- At least one AI provider API key (optional; the Mock provider
  enables full pipeline operation without any external AI service)

---

## Local setup

1. Clone the repository.

   ```
   git clone <repo-url> afri-scout
   cd afri-scout
   ```

2. Install dependencies.

   ```
   npm install
   ```

3. Copy environment files.

   ```
   cp .env.example .env
   cp .env.test.example .env.test
   ```

4. Edit `.env` and set the required values. At minimum:

   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_FULL_NAME`
   - `APIFY_TOKEN`, `APIFY_WEBHOOK_SECRET` (required for real discovery)
   - AI provider keys (optional; leave blank to use the Mock provider)

5. Start Postgres and Redis.

   ```
   npm run docker:up
   ```

6. Generate the Prisma client and run migrations.

   ```
   npm run db:generate
   npm run db:migrate
   ```

7. Seed reference data (roles, permissions, categories, countries,
   currencies, settings, and one super admin account).

   ```
   npm run db:seed
   ```

8. Start the API, the worker, and the web app in separate terminals
   or in one command:

   ```
   npm run dev
   ```

   Default endpoints:

   - API: http://localhost:4000/api/v1
   - Web: http://localhost:5173
   - Health: http://localhost:4000/api/v1/health

9. Sign in with the super admin credentials from your `.env`.

10. Open the admin platform, add a source, configure its adapter,
    test extraction, activate it, then schedule and monitor runs
    through the Sources and Actor Runs screens.

---

## Environment configuration

All configuration lives in `.env` at the repository root for local
development, and in Render environment variables for production.
A full list with descriptions is in `.env.example`.

No secrets are ever exposed to the frontend. Only variables prefixed
with `VITE_` are embedded into the web bundle, and those must never
contain credentials.

---

## Database

PostgreSQL, managed with Prisma.

Schema layout:

```
apps/api/src/database/prisma/
  schema.prisma          merge entry
  schema/*.prisma        domain-split schema files
  migrations/            Prisma migrations
  seed/                  Reference-data seed scripts
```

Common commands:

```
npm run db:generate         regenerate the Prisma client
npm run db:migrate          create and apply a migration in development
npm run db:migrate:deploy   apply pending migrations (production)
npm run db:reset            drop and recreate the database (development only)
npm run db:seed             seed reference data
npm run db:studio           open Prisma Studio
```

The seed provisions only legitimate reference data and the initial
super admin account. It never creates opportunities, sources,
matches, notifications, or statistics.

---

## Apify integration

AfriScout uses Apify as its web discovery and monitoring layer.

Actors (independent packages under `apify/actors/`):

- `opportunity-discovery` — discovers opportunities from registered
  sources using per-source adapters
- `document-extractor` — extracts structured information from
  opportunity documents (PDF, DOCX, HTML)
- `opportunity-monitor` — re-checks active opportunities and reports
  meaningful changes

The backend triggers Actors through the Apify API, receives signed
webhooks, retrieves datasets, and enqueues ingestion through BullMQ.

The Apify token is server-side only. It is never sent to the browser.

Every Actor run is recorded in `source_runs` with status, counts,
timing, and error details. Source health is derived from run history.

---

## AI intelligence layer

All AI usage flows through a provider-agnostic interface with a
configurable fallback chain.

Default order:

```
OpenAI -> Anthropic -> Gemini -> Mock
```

Behavior:

- No provider-specific code exists outside `services/ai/providers/`.
- Every AI output is stored with provider, model, task, prompt
  version, timestamp, token usage, and confidence where available.
- AI output is always labeled as AI-generated in API responses and
  in the user interface.
- Source facts and AI interpretation are stored and returned
  separately and are never conflated.
- A Mock provider produces deterministic structured output so the
  full pipeline runs end-to-end without external AI keys. Switching
  to real providers requires only an environment change.

---

## Background jobs

Queues and workers are implemented with BullMQ on Redis.

Queues:

- pipeline
- matching
- notification
- apify
- document
- maintenance
- webhook

Workers run in a separate process:

```
npm run start:worker
```

Schedulers enqueue recurring jobs for source crawling, deadline
checks, expiry, health snapshots, and source suggestion processing.

---

## API

Base path:

```
/api/v1
```

Public endpoints (subset):

```
GET /api/v1/health
GET /api/v1/opportunities
GET /api/v1/opportunities/:id
GET /api/v1/search
GET /api/v1/categories
GET /api/v1/countries
GET /api/v1/organizations
GET /api/v1/sources
```

Authenticated endpoints (subset):

```
GET  /api/v1/matches
GET  /api/v1/radar
GET  /api/v1/saved
GET  /api/v1/watchlist
GET  /api/v1/pipeline
GET  /api/v1/notifications
GET  /api/v1/analytics
POST /api/v1/ai/analyst
POST /api/v1/ai/ask
```

Admin endpoints (subset):

```
GET    /api/v1/admin/sources
POST   /api/v1/admin/sources
POST   /api/v1/admin/sources/:id/test
POST   /api/v1/admin/sources/:id/activate
GET    /api/v1/admin/actor-runs
GET    /api/v1/admin/duplicates
POST   /api/v1/admin/duplicates/:id/merge
GET    /api/v1/admin/changes
GET    /api/v1/admin/audit-logs
```

API keys are issued through the developer portal and hashed at
rest. Scopes and per-key rate limits apply.

Documentation:

```
docs/api/api-documentation.md
docs/api/authentication.md
docs/api/rate-limiting.md
docs/api/webhooks.md
docs/api/errors.md
```

---

## Testing

```
npm run test
```

Unit, integration, and end-to-end tests are organized under
`apps/api/tests` and `apps/web/src/**/*.test.ts(x)` where applicable.
Tests run against a dedicated Postgres and Redis instance started
by `docker-compose.test.yml`.

---

## Deployment (Render)

`render.yaml` at the repository root defines:

- afriscout-api     (web service)
- afriscout-worker  (background worker)
- afriscout-web     (static site)
- afriscout-postgres (managed Postgres)
- afriscout-redis   (managed Redis)

To deploy:

1. Push the repository to a Git provider connected to Render.
2. Create a new Blueprint from `render.yaml`.
3. Fill the `sync: false` environment variables in the Render
   dashboard (Apify token, AI provider keys, super admin
   credentials, CORS origins, SMTP, web push, storage, Sentry).
4. Deploy. Migrations are applied on release through the API
   release command.

---

## Documentation

Full documentation lives in `docs/`:

- `docs/architecture/`  system architecture, data flow, decisions
- `docs/database/`      schema and ERD
- `docs/api/`           API reference and guides
- `docs/product/`       product overview, lifecycles, matching
- `docs/operations/`    runbook, monitoring, incident response
- `docs/design/`        design tokens, components, accessibility
- `docs/contributing/`  contribution guidelines

---

## Principles

- Real sources, real data, real intelligence, real actions.
- No fabricated opportunities and no fabricated statistics.
- Source facts and AI interpretation are always separated.
- Source attribution and provenance are preserved on every record.
- The publisher owns the official application. AfriScout owns the
  intelligence and the workflow.
- No secrets in the frontend.
- No emojis anywhere in the product.
- Empty and error states are honest and instructive.

---

## License

Proprietary. See `LICENSE`.