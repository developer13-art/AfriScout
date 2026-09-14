# AfriScout — Architecture Decision Record (ADR)

This document is the binding record of every significant technical decision
made for AfriScout. All future code, schema, and infrastructure must conform
to these decisions unless a new ADR supersedes one.

---

## ADR-001 — Monorepo with npm workspaces

Status: Accepted

Context:
AfriScout consists of a web app, an API, a background worker, shared domain
types, shared validators, and independent Apify Actors. These pieces must
share types and evolve together.

Decision:
Use a single monorepo managed with npm workspaces.

Workspaces:
  apps/web
  apps/api
  packages/shared
  packages/config

Apify Actors live under `apify/actors/*` and are independent TypeScript
packages with their own package.json, build, and Dockerfile, deployed to
Apify's platform.

Consequences:
  Positive:
    - Shared types and validators are single-sourced.
    - Atomic changes across web, api, shared, and config.
    - One lockfile, one install.
    - CI can build and test the entire platform together.
  Negative:
    - Larger install footprint.
    - Requires discipline around workspace boundaries.

---

## ADR-002 — PostgreSQL as the primary datastore

Status: Accepted

Context:
AfriScout stores structured opportunities, sources, raw Apify payloads,
AI responses, matching results, pipeline state, audit logs, and API keys.
Requirements include full-text search, fuzzy title matching for
deduplication, JSONB for flexible payloads, strong indexing for
geographic + category + deadline queries, and future support for
row-level isolation across enterprise tenants.

Decision:
Use PostgreSQL (Render Managed Postgres in production).

Rationale:
  - JSONB for raw Apify payloads, AI responses, and category-specific
    attributes without schema churn.
  - Built-in full-text search for opportunity discovery.
  - pg_trgm for deduplication similarity scoring.
  - Strong composite indexing for the primary query patterns.
  - Row-level security available for future multi-tenant isolation.
  - Optional PostGIS for the African Opportunity Map.
  - Mature operational tooling on Render.

Consequences:
  - No dependency on a separate search engine at launch.
  - Search remains index-driven and tunable.
  - We must design indexes carefully from the start.

---

## ADR-003 — Prisma as the ORM and migration tool

Status: Accepted

Context:
The schema contains approximately 26 tables with strong relational
integrity, enums, and versioned records. We need migrations, seeding,
and a fully typed client usable from both API and worker processes.

Decision:
Use Prisma with a domain-split schema.

Layout:
  apps/api/src/database/prisma/
    schema.prisma            (merge entry)
    schema/                  (domain-split .prisma files)
      user.prisma
      dna.prisma
      source.prisma
      opportunity.prisma
      organization.prisma
      ai.prisma
      matching.prisma
      pipeline.prisma
      notification.prisma
      api.prisma
      audit.prisma
      system.prisma
    migrations/
    seed/

Consequences:
  - Typed queries with compile-time safety across the codebase.
  - Deterministic migrations reviewed in CI.
  - Raw SQL remains available for perf-critical paths.

---

## ADR-004 — Redis + BullMQ for queues, workers, and rate limiting

Status: Accepted

Context:
The opportunity pipeline (ingestion, normalization, validation,
deduplication, change detection, AI processing, matching, notifications)
must run asynchronously. HTTP requests cannot carry these workloads.

Decision:
Use Redis (Render Managed Redis) with BullMQ for all queues and workers.
Use Redis for distributed rate limiting.

Queues:
  pipeline
  matching
  notification
  apify
  document
  maintenance
  webhook

Workers:
  pipeline.worker
  matching.worker
  notification.worker
  apify.worker
  document.worker
  maintenance.worker
  webhook.worker

Workers run as a separate process (worker.entry.ts) from the API server.

Consequences:
  - Apify webhooks return immediately and enqueue work.
  - Independent scaling of API and workers.
  - Retry, backoff, and dead-letter are first-class.

---

## ADR-005 — Provider-agnostic AI layer with fallback chain

Status: Accepted

Context:
AI is used for classification, summarization, eligibility extraction,
requirement extraction, document intelligence, risk analysis, action
recommendations, the Opportunity Analyst, and Ask AfriScout intent
parsing. The specific provider must not be baked into business logic.

Decision:
Define an `AiProvider` interface. Implement concrete providers for
OpenAI, Anthropic, and Gemini. Route every AI task through a fallback
service that tries providers in a configured order.

Fallback order (default):
  1. OpenAI
  2. Anthropic
  3. Gemini

Provider order is configurable via environment variables.

Until real API keys are supplied, a MockProvider that returns
deterministic structured output is used. Switching to real providers
requires only an environment change.

Rules:
  - No provider-specific code outside `services/ai/providers/`.
  - Every AI output is stored with provider, model, task, prompt version,
    timestamp, and token usage.
  - All AI output is labeled as AI-generated in both API responses and UI.
  - Source facts and AI interpretation are stored and returned separately.

Consequences:
  - Providers can be swapped or added without touching business logic.
  - Cost, latency, and quality can be tuned per task.
  - Testing can run fully offline.

---

## ADR-006 — Apify as the discovery and monitoring layer

Status: Accepted

Context:
AfriScout must continuously discover opportunities from many legitimate
public sources across Africa. Sources vary in structure, language, and
update cadence. A monolithic scraper is unmaintainable.

Decision:
Use Apify Actors as the web discovery and extraction layer, with a
source-adapter architecture.

Primary Actors (independent packages under apify/actors):
  opportunity-discovery
  document-extractor
  opportunity-monitor

Each Actor accepts a source descriptor, selects the correct adapter by
the `adapter` field, extracts a normalized opportunity payload, and
writes structured items to an Apify Dataset. The backend receives a
signed webhook, then retrieves the dataset via the Apify API and
enqueues ingestion.

Rules:
  - Apify API token is server-side only. Never sent to the frontend.
  - Every run is recorded in `source_runs` with status, counts, timing,
    and error details.
  - Every opportunity stores source id, source url, discovery timestamp,
    and provenance.
  - The platform is pan-African by design. Country is data, not schema.

Consequences:
  - New sources are added via the admin platform without code changes
    when a suitable adapter exists.
  - New source archetypes require a new adapter, not a new system.
  - Source health becomes measurable and actionable.

---

## ADR-007 — Source-adapter architecture

Status: Accepted

Context:
Public sources differ in markup, pagination, terminology, and update
patterns. We need a uniform extraction contract.

Decision:
Every source declares an `adapter`. Adapters implement a shared
interface: fetch listings, fetch detail pages, extract documents,
and return a normalized opportunity payload.

Adapters are organized by archetype and extended per source:
  government
  procurementPortal
  university
  ngo
  foundation
  accelerator
  grantPortal
  jobBoard
  scholarshipPortal
  genericListing
  genericRss
  genericSitemap

Consequences:
  - Adding a source is data plus, at most, one adapter.
  - Source failures are isolated and diagnosable.
  - Extraction quality can be tracked per adapter.

---

## ADR-008 — Two separate lifecycles

Status: Accepted

Context:
An opportunity has an internal data lifecycle (how the platform
processes it) and a per-user lifecycle (how a user pursues it). Mixing
them corrupts both analytics and UX.

Decision:
Maintain two independent state machines.

System/data lifecycle:
  DISCOVERED
  RAW
  NORMALIZED
  VALIDATED
  DEDUPLICATED
  VERIFIED
  ANALYZED
  PUBLISHED
  MONITORED
  UPDATED
  EXPIRED

User lifecycle:
  DISCOVERED
  REVIEWING
  QUALIFIED
  PREPARING
  SUBMITTED
  UNDER_REVIEW
  WON
  LOST
  WITHDRAWN
  DISQUALIFIED
  EXPIRED

Both are defined as enums in packages/shared and are never conflated
in code, database columns, or API responses.

Consequences:
  - Analytics can distinguish platform health from user outcomes.
  - Filtering and reporting remain unambiguous.

---

## ADR-009 — Canonical opportunity with multiple sources

Status: Accepted

Context:
The same opportunity frequently appears on multiple websites. Showing
duplicates destroys trust and inflates counts.

Decision:
Maintain one canonical `opportunities` record per real opportunity,
linked to one or more `opportunity_sources` rows.

Deduplication compares title similarity (pg_trgm), organization,
deadline, location, description, reference numbers, document URLs, and
URLs. A confidence threshold determines merge, review, or separate.

Consequences:
  - Users see one opportunity with multiple supporting sources.
  - Source attribution is preserved on every linked source.
  - Duplicate review is a first-class admin workflow.

---

## ADR-010 — Change detection and versioning

Status: Accepted

Context:
Deadlines change, requirements change, opportunities are extended or
cancelled. Acting on stale information is a core failure mode.

Decision:
Every canonical opportunity has a version history. Each ingestion
compares the incoming normalized payload against the current version
across tracked fields: deadline, requirements, documents, description,
value, eligibility, location, application instructions, and status.

When a tracked field changes, the system records an `opportunity_changes`
event, creates a new version, and notifies watchers according to
notification preferences.

Consequences:
  - Users can see how an opportunity evolved.
  - Watchers are alerted to material changes only.
  - Historical data supports analytics and prediction later.

---

## ADR-011 — Explainable, weighted matching

Status: Accepted

Context:
A match score without reasons is untrustworthy and unactionable.

Decision:
Matching uses weighted components with an explicit, inspectable
breakdown. Every match returns a score, a band, structured reasons,
and structured concerns. The score is never returned without
explanation.

Default weights (configurable):
  Industry     25
  Location     20
  Capability   20
  Value        15
  Eligibility  10
  Experience   10
  Total       100

Consequences:
  - Users can see why an opportunity fits or does not fit.
  - Weights can be tuned per user type without code changes.
  - Match quality is measurable against outcomes.

---

## ADR-012 — Source facts vs AI interpretation

Status: Accepted

Context:
Blending publisher facts with AI inference erodes trust and creates
legal and product risk.

Decision:
The data model, API, and UI keep three data classes distinct:
  1. Source facts (as extracted from the publisher)
  2. AI interpretation (summary, eligibility analysis, recommendations)
  3. User data (DNA, pipeline, notes)

AI output is always labeled as AI-generated, tagged with provider,
model, task, and timestamp, and never overwrites source facts.

Consequences:
  - Trust, auditability, and compliance are preserved.
  - We can change models without rewriting history.

---

## ADR-013 — Product boundary: intelligence, not submission

Status: Accepted

Context:
Opportunities are applied to on the publisher's own system. Claiming
otherwise would be false and risky.

Decision:
AfriScout owns discovery, intelligence, matching, workflow, and
tracking. The publisher owns the official application. Every
opportunity exposes its official source URL. The user records their
own submission status, date, and reference.

AfriScout never claims to have submitted an application on the
user's behalf.

Consequences:
  - A clear, defensible product boundary.
  - No misrepresentation of action.

---

## ADR-014 — Render as the deployment platform

Status: Accepted

Context:
We need managed Postgres, managed Redis, a Node web service, a static
or web-service frontend, background workers, and cron scheduling
without maintaining servers.

Decision:
Deploy on Render.

Services:
  - Render Web Service: apps/api
  - Render Background Worker: apps/api workers
  - Render Static Site or Web Service: apps/web
  - Render Managed Postgres
  - Render Managed Redis
  - Render Cron Jobs for fallback scheduling
  - Apify Actors run on Apify infra, triggered by API, webhooks back to API

`render.yaml` at the repo root defines all services as code.

Consequences:
  - Secrets live in Render environment groups, never in the repo.
  - Local development uses docker-compose for Postgres and Redis.

---

## ADR-015 — Security baseline

Status: Accepted

Decision:
  - JWT access tokens with refresh rotation.
  - Passwords hashed with Argon2id.
  - RBAC with roles: SUPER_ADMIN, DATA_ADMIN, USER, API_DEVELOPER.
  - API keys hashed at rest; shown once at creation.
  - Per-route rate limiting backed by Redis.
  - Input validation with Zod on every route.
  - Signed Apify webhooks; signature verified server-side.
  - Signed outbound webhooks with HMAC and retries.
  - Audit log for every privileged action.
  - Secrets only via environment. Never in the frontend bundle.
  - Helmet, strict CORS, request-id propagation.

Consequences:
  - Security is enforced at the boundary, not scattered.
  - Every privileged action is traceable.

---

## ADR-016 — No emojis. No fake data.

Status: Accepted

Decision:
  - No emojis anywhere in code, UI, docs, or API responses.
  - No fake opportunities, no fabricated statistics, no synthetic
    counts presented as real.
  - Seeding is limited to legitimate reference data: roles,
    permissions, categories, subcategories, countries, locations,
    currencies, settings, notification templates, and one super admin
    account provisioned from environment values.
  - Empty states are honest and instructive.

Consequences:
  - The product earns trust by construction.

---

## ADR-017 — Folder structure is contractual

Status: Accepted

Decision:
The approved project structure is authoritative. New modules must fit
the existing hierarchy. Structural changes require an update to this
ADR and the structure document.

---

## ADR-018 — Documentation is part of the product

Status: Accepted

Decision:
Architecture, database, API, product, operations, design, and
contributing docs live in `docs/` and are maintained alongside code.
No feature is considered complete without matching documentation.