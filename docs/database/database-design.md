# AfriScout — Database Design

Engine: PostgreSQL
ORM: Prisma (domain-split schema)
Migrations: Prisma Migrate
Primary keys: UUID v7 (time-ordered) unless otherwise noted
Timestamps: all tables include created_at and updated_at (UTC)

Design principles:
  - Source facts, AI interpretation, and user data are stored separately.
  - Two lifecycles (system, user) are never merged.
  - Provenance is preserved on every opportunity.
  - JSONB is used for raw payloads and flexible category attributes.
  - Full-text and trigram indexes support discovery and deduplication.

---

## Entity groups

  1. Identity and access
  2. User profiles and DNA
  3. Organizations
  4. Sources and Apify
  5. Opportunities and intelligence
  6. AI
  7. Matching
  8. User workflow (saved, watchlist, pipeline)
  9. Notifications
 10. Platform (API keys, webhooks, audit, settings)

---

## 1. Identity and access

### users
- id                    uuid pk
- email                 citext unique not null
- email_verified_at     timestamptz
- password_hash         text not null
- full_name             text not null
- phone                 text
- country_code          char(2)
- avatar_url            text
- role                  user_role not null
- status                user_status not null default 'ACTIVE'
- last_login_at         timestamptz
- failed_login_count    int not null default 0
- locked_until          timestamptz
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  unique (email)
  index (role)
  index (status)

Enum user_role:
  SUPER_ADMIN, DATA_ADMIN, USER, API_DEVELOPER

Enum user_status:
  ACTIVE, PENDING, SUSPENDED, DELETED

### sessions
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- refresh_token_hash    text not null
- user_agent            text
- ip_address            inet
- expires_at            timestamptz not null
- revoked_at            timestamptz
- created_at            timestamptz not null default now()

Indexes:
  index (user_id)
  index (expires_at)

### password_resets
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- token_hash            text not null unique
- expires_at            timestamptz not null
- used_at               timestamptz
- created_at            timestamptz not null default now()

### email_verifications
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- token_hash            text not null unique
- expires_at            timestamptz not null
- verified_at           timestamptz
- created_at            timestamptz not null default now()

### permissions
- id                    uuid pk
- key                   text unique not null
- description           text not null
- created_at            timestamptz not null default now()

### role_permissions
- role                  user_role not null
- permission_id         uuid fk permissions(id) on delete cascade
- primary key (role, permission_id)

---

## 2. User profiles and DNA

A user may be an individual (professional, student) or associated with
an organization. Profile tables hold role-specific data. DNA tables
hold matching-relevant attributes.

### user_profiles
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade unique
- user_type             user_type not null
- headline              text
- bio                   text
- languages             text[]
- timezone              text
- preferred_currency    char(3)
- onboarding_completed  boolean not null default false
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Enum user_type:
  BUSINESS, PROFESSIONAL, STUDENT, RESEARCHER, NGO, STARTUP, OTHER

### professional_profiles
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade unique
- profession            text
- seniority             text
- years_experience      int
- skills                text[]
- certifications        text[]
- portfolio_url         text
- linkedin_url          text
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

### student_profiles
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade unique
- education_level       text
- field_of_study        text
- institution           text
- graduation_year       int
- interests             text[]
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

### researcher_profiles
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade unique
- research_fields       text[]
- publications_url      text
- institution           text
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

### dna_profiles
The canonical matching input. One active DNA per user.
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- version               int not null default 1
- is_active             boolean not null default true
- industries            text[]
- capabilities          text[]
- sectors               text[]
- preferred_countries   char(2)[]
- preferred_locations   text[]
- remote_preference     remote_preference
- currency              char(3)
- min_value             numeric(20,2)
- max_value             numeric(20,2)
- eligibility_notes     text
- experience_notes      text
- opportunity_types     opportunity_type[]
- opportunity_categories opportunity_category[]
- keywords              text[]
- extra                 jsonb not null default '{}'::jsonb
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  unique (user_id, version)
  index (user_id) where is_active = true
  gin (industries)
  gin (capabilities)
  gin (preferred_countries)

Enum remote_preference:
  ONSITE, REMOTE, HYBRID, ANY

### dna_capabilities
Normalized capability rows for precise matching and analytics.
- id                    uuid pk
- dna_profile_id        uuid fk dna_profiles(id) on delete cascade
- capability            text not null
- strength              int
- created_at            timestamptz not null default now()

Indexes:
  index (dna_profile_id)
  index (capability)

---

## 3. Organizations

### organizations
- id                    uuid pk
- name                  text not null
- slug                  text unique not null
- type                  organization_type
- country_code          char(2)
- website               text
- description           text
- verified              boolean not null default false
- verified_at           timestamptz
- logo_url              text
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  unique (slug)
  index (country_code)
  trigram index on name

Enum organization_type:
  GOVERNMENT, PRIVATE, NGO, FOUNDATION, UNIVERSITY, DEVELOPMENT,
  ACCELERATOR, INCUBATOR, OTHER

### organization_members
- id                    uuid pk
- organization_id       uuid fk organizations(id) on delete cascade
- user_id               uuid fk users(id) on delete cascade
- role                  organization_role not null
- created_at            timestamptz not null default now()

Indexes:
  unique (organization_id, user_id)

Enum organization_role:
  OWNER, ADMIN, MEMBER

---

## 4. Sources and Apify

### sources
- id                    uuid pk
- name                  text not null
- slug                  text unique not null
- country_code          char(2)
- region                text
- language              text
- currency              char(3)
- category              opportunity_category
- source_type           source_type not null
- url                   text not null
- adapter               text not null
- active                boolean not null default false
- crawl_frequency       crawl_frequency not null default 'DAILY'
- attribution_required  boolean not null default true
- terms_url             text
- notes                 text
- health                source_health not null default 'UNKNOWN'
- last_success_at       timestamptz
- last_failure_at       timestamptz
- last_run_at           timestamptz
- consecutive_failures  int not null default 0
- success_count         int not null default 0
- failure_count         int not null default 0
- items_total           int not null default 0
- created_by            uuid fk users(id)
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  unique (slug)
  index (active)
  index (country_code)
  index (category)
  index (health)

Enum source_type:
  GOVERNMENT, PROCUREMENT_PORTAL, UNIVERSITY, NGO, FOUNDATION,
  ACCELERATOR, GRANT_PORTAL, JOB_BOARD, SCHOLARSHIP_PORTAL,
  DEVELOPMENT_ORG, PRIVATE_COMPANY, OTHER

Enum source_health:
  UNKNOWN, HEALTHY, WARNING, FAILED, INACTIVE

Enum crawl_frequency:
  EVERY_6_HOURS, EVERY_12_HOURS, DAILY, WEEKLY, MANUAL

### source_suggestions
- id                    uuid pk
- suggested_by          uuid fk users(id)
- name                  text not null
- url                   text not null
- country_code          char(2)
- category              opportunity_category
- notes                 text
- status                suggestion_status not null default 'SUGGESTED'
- reviewed_by           uuid fk users(id)
- reviewed_at           timestamptz
- review_notes          text
- created_at            timestamptz not null default now()

Enum suggestion_status:
  SUGGESTED, REVIEWED, VERIFIED, ACTIVATED, REJECTED

### source_adapters
Registry of adapter identifiers and their metadata.
- id                    uuid pk
- key                   text unique not null
- label                 text not null
- version               text not null
- description           text
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

### source_runs
- id                    uuid pk
- source_id             uuid fk sources(id) on delete cascade
- actor_id              text
- apify_run_id          text
- apify_dataset_id      text
- status                run_status not null
- trigger               run_trigger not null
- items_found           int not null default 0
- items_imported        int not null default 0
- items_updated         int not null default 0
- items_duplicate       int not null default 0
- items_invalid         int not null default 0
- started_at            timestamptz
- finished_at           timestamptz
- duration_ms           int
- error_message         text
- error_details         jsonb
- created_by            uuid fk users(id)
- created_at            timestamptz not null default now()

Indexes:
  index (source_id, created_at desc)
  index (status)
  index (apify_run_id)

Enum run_status:
  QUEUED, RUNNING, SUCCEEDED, FAILED, ABORTED, TIMED_OUT

Enum run_trigger:
  SCHEDULE, MANUAL_ADMIN, WEBHOOK, RETRY

### source_run_items
Raw link between a run and the raw items it produced.
- id                    uuid pk
- source_run_id         uuid fk source_runs(id) on delete cascade
- raw_opportunity_id    uuid fk raw_opportunities(id) on delete cascade
- created_at            timestamptz not null default now()

Indexes:
  index (source_run_id)
  index (raw_opportunity_id)

### raw_opportunities
Immutable extraction output from Apify, before normalization.
- id                    uuid pk
- source_id             uuid fk sources(id)
- source_run_id         uuid fk source_runs(id)
- apify_dataset_item_id text
- payload               jsonb not null
- payload_hash          text not null
- fetched_at            timestamptz not null default now()
- processed_at          timestamptz
- processing_status     raw_status not null default 'PENDING'
- processing_error      text
- created_at            timestamptz not null default now()

Indexes:
  index (source_id)
  index (processing_status)
  unique (payload_hash, source_id)

Enum raw_status:
  PENDING, PROCESSING, PROCESSED, FAILED, SKIPPED

---

## 5. Opportunities and intelligence

### opportunities (canonical)
- id                    uuid pk
- title                 text not null
- slug                  text unique not null
- organization_id       uuid fk organizations(id)
- organization_name     text
- category              opportunity_category not null
- subcategory           text
- opportunity_type      opportunity_type not null
- country_code          char(2)
- region                text
- city                  text
- location_text         text
- is_remote             boolean not null default false
- description           text
- summary_short         text
- value_min             numeric(20,2)
- value_max             numeric(20,2)
- currency              char(3)
- published_at          timestamptz
- deadline              timestamptz
- deadline_confirmed    boolean not null default false
- eligibility           text
- requirements          text
- application_method    text
- application_url       text
- reference_number      text
- status                opportunity_status not null default 'PUBLISHED'
- system_state          system_lifecycle not null default 'PUBLISHED'
- verification_status   verification_status not null default 'UNVERIFIED'
- verified_at           timestamptz
- verified_by           uuid fk users(id)
- ai_processed          boolean not null default false
- ai_processed_at       timestamptz
- search_vector         tsvector
- extra                 jsonb not null default '{}'::jsonb
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  unique (slug)
  index (category)
  index (opportunity_type)
  index (country_code)
  index (deadline)
  index (status)
  index (system_state)
  index (published_at desc)
  gin (search_vector)
  trigram index on title
  composite (country_code, category, deadline)
  composite (status, deadline)

Enum opportunity_category:
  PROCUREMENT, CONTRACTS, GRANTS, FUNDING, EMPLOYMENT, INTERNSHIPS,
  SCHOLARSHIPS, FELLOWSHIPS, ACCELERATORS, INCUBATORS, COMPETITIONS,
  TRAINING, RESEARCH, PARTNERSHIPS, INVESTMENT, DEVELOPMENT, OTHER

Enum opportunity_type:
  TENDER, RFP, RFQ, CONTRACT, GRANT, FUNDING, JOB, INTERNSHIP,
  SCHOLARSHIP, FELLOWSHIP, ACCELERATOR, INCUBATOR, COMPETITION,
  HACKATHON, TRAINING, RESEARCH, PARTNERSHIP, INVESTMENT,
  CONSULTANCY, SUPPLIER, VENDOR, CALL_FOR_PROPOSALS, OTHER

Enum opportunity_status:
  DRAFT, PUBLISHED, CLOSED, CANCELLED, ARCHIVED

Enum system_lifecycle:
  DISCOVERED, RAW, NORMALIZED, VALIDATED, DEDUPLICATED, VERIFIED,
  ANALYZED, PUBLISHED, MONITORED, UPDATED, EXPIRED

Enum verification_status:
  UNVERIFIED, PARTIAL, VERIFIED, DISPUTED

### opportunity_sources
Links a canonical opportunity to every source it appeared on.
- id                    uuid pk
- opportunity_id        uuid fk opportunities(id) on delete cascade
- source_id             uuid fk sources(id) on delete cascade
- raw_opportunity_id    uuid fk raw_opportunities(id)
- source_url            text not null
- source_title          text
- published_at          timestamptz
- deadline              timestamptz
- is_primary            boolean not null default false
- last_seen_at          timestamptz not null default now()
- created_at            timestamptz not null default now()

Indexes:
  index (opportunity_id)
  index (source_id)
  unique (opportunity_id, source_id, source_url)

### opportunity_documents
- id                    uuid pk
- opportunity_id        uuid fk opportunities(id) on delete cascade
- source_id             uuid fk sources(id)
- url                   text not null
- file_name             text
- mime_type             text
- file_size             bigint
- checksum              text
- fetched_at            timestamptz
- extraction_status     document_status not null default 'PENDING'
- extraction_error      text
- extracted_text        text
- extracted_fields      jsonb
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  index (opportunity_id)
  index (extraction_status)

Enum document_status:
  PENDING, FETCHING, EXTRACTING, EXTRACTED, FAILED, SKIPPED

### opportunity_requirements
Structured requirements extracted from source or AI, individually tracked.
- id                    uuid pk
- opportunity_id        uuid fk opportunities(id) on delete cascade
- kind                  requirement_kind not null
- label                 text not null
- description           text
- is_mandatory          boolean not null default true
- source                requirement_source not null
- created_at            timestamptz not null default now()

Indexes:
  index (opportunity_id)

Enum requirement_kind:
  DOCUMENT, EXPERIENCE, CERTIFICATION, FINANCIAL, TECHNICAL,
  ELIGIBILITY, GEOGRAPHIC, LEGAL, OTHER

Enum requirement_source:
  SOURCE_FACT, AI_INTERPRETATION

### opportunity_versions
Immutable snapshot of key fields per version.
- id                    uuid pk
- opportunity_id        uuid fk opportunities(id) on delete cascade
- version               int not null
- snapshot              jsonb not null
- snapshot_hash         text not null
- created_by_run_id     uuid fk source_runs(id)
- created_at            timestamptz not null default now()

Indexes:
  unique (opportunity_id, version)
  index (opportunity_id)

### opportunity_changes
Change events between versions.
- id                    uuid pk
- opportunity_id        uuid fk opportunities(id) on delete cascade
- from_version          int
- to_version            int
- field                 text not null
- old_value             jsonb
- new_value             jsonb
- severity              change_severity not null default 'NORMAL'
- detected_at           timestamptz not null default now()
- notified              boolean not null default false
- created_at            timestamptz not null default now()

Indexes:
  index (opportunity_id)
  index (detected_at desc)
  index (notified)

Enum change_severity:
  NORMAL, IMPORTANT, CRITICAL

### opportunity_duplicates
Candidate duplicate pairs awaiting review or auto-merge.
- id                    uuid pk
- canonical_id          uuid fk opportunities(id) on delete cascade
- candidate_id          uuid fk opportunities(id) on delete cascade
- similarity            numeric(5,4) not null
- signals               jsonb not null
- status                duplicate_status not null default 'PENDING'
- reviewed_by           uuid fk users(id)
- reviewed_at           timestamptz
- created_at            timestamptz not null default now()

Enum duplicate_status:
  PENDING, MERGED, SEPARATE, IGNORED

### opportunity_views
Aggregate and per-user view events for analytics.
- id                    uuid pk
- opportunity_id        uuid fk opportunities(id) on delete cascade
- user_id               uuid fk users(id)
- viewed_at             timestamptz not null default now()
- source                text

Indexes:
  index (opportunity_id)
  index (user_id)

---

## 6. AI

### ai_analyses
One row per AI task output, keyed to opportunity and version.
- id                    uuid pk
- opportunity_id        uuid fk opportunities(id) on delete cascade
- opportunity_version   int
- task_type             ai_task_type not null
- provider              ai_provider not null
- model                 text not null
- prompt_version        text not null
- input_hash            text not null
- output                jsonb not null
- output_text           text
- confidence            numeric(4,3)
- tokens_input          int
- tokens_output         int
- cost_usd              numeric(10,6)
- latency_ms            int
- status                ai_status not null default 'SUCCEEDED'
- error_message         text
- created_at            timestamptz not null default now()

Indexes:
  index (opportunity_id)
  index (task_type)
  index (provider)
  index (created_at desc)

Enum ai_provider:
  OPENAI, ANTHROPIC, GEMINI, MOCK

Enum ai_task_type:
  CLASSIFICATION, SUMMARY, ELIGIBILITY, REQUIREMENTS, DOCUMENT,
  RISK, RECOMMENDATIONS, ANALYST, SEARCH_INTENT, OTHER

Enum ai_status:
  QUEUED, RUNNING, SUCCEEDED, FAILED, FALLBACK_USED

### ai_prompts
Versioned prompts so AI output remains reproducible.
- id                    uuid pk
- task_type             ai_task_type not null
- version               text not null
- template              text not null
- active                boolean not null default true
- created_at            timestamptz not null default now()

Indexes:
  unique (task_type, version)

### ai_usage_daily
Aggregated usage for cost and quota reporting.
- id                    uuid pk
- day                   date not null
- provider              ai_provider not null
- task_type             ai_task_type not null
- requests              int not null default 0
- tokens_input          bigint not null default 0
- tokens_output         bigint not null default 0
- cost_usd              numeric(12,6) not null default 0
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  unique (day, provider, task_type)

---

## 7. Matching

### matches
Computed match between a user (via DNA) and an opportunity.
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- dna_profile_id        uuid fk dna_profiles(id)
- opportunity_id        uuid fk opportunities(id) on delete cascade
- score                 int not null
- band                  match_band not null
- breakdown             jsonb not null
- reasons               jsonb not null
- concerns              jsonb not null
- weights_version       text not null
- computed_at           timestamptz not null default now()
- notified              boolean not null default false
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  unique (user_id, opportunity_id, dna_profile_id)
  index (user_id, score desc)
  index (opportunity_id)
  index (band)

Enum match_band:
  VERY_STRONG, STRONG, MODERATE, WEAK, POOR

### match_weights
Weights per user type, versioned.
- id                    uuid pk
- user_type             user_type not null
- version               text not null
- weights               jsonb not null
- active                boolean not null default true
- created_at            timestamptz not null default now()

Indexes:
  unique (user_type, version)

---

## 8. User workflow

### saved_opportunities
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- opportunity_id        uuid fk opportunities(id) on delete cascade
- created_at            timestamptz not null default now()

Indexes:
  unique (user_id, opportunity_id)
  index (user_id, created_at desc)

### watchlists
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- opportunity_id        uuid fk opportunities(id) on delete cascade
- notify_deadline       boolean not null default true
- notify_changes        boolean not null default true
- created_at            timestamptz not null default now()

Indexes:
  unique (user_id, opportunity_id)
  index (user_id)

### pipelines
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- name                  text not null default 'Default'
- is_default            boolean not null default true
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  index (user_id)

### pipeline_items
- id                    uuid pk
- pipeline_id           uuid fk pipelines(id) on delete cascade
- opportunity_id        uuid fk opportunities(id) on delete cascade
- stage                 pipeline_stage not null default 'REVIEWING'
- owner_user_id         uuid fk users(id)
- notes                 text
- submission_date       timestamptz
- submission_reference  text
- outcome_type          outcome_type
- outcome_value         numeric(20,2)
- outcome_currency      char(3)
- outcome_date          timestamptz
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  unique (pipeline_id, opportunity_id)
  index (pipeline_id, stage)

Enum pipeline_stage:
  DISCOVERED, REVIEWING, QUALIFIED, PREPARING, SUBMITTED,
  UNDER_REVIEW, WON, LOST, WITHDRAWN, DISQUALIFIED, EXPIRED

Enum outcome_type:
  WON, LOST, WITHDRAWN, DISQUALIFIED, EXPIRED, PENDING

### pipeline_events
Immutable event log for pipeline items.
- id                    uuid pk
- pipeline_item_id      uuid fk pipeline_items(id) on delete cascade
- type                  pipeline_event_type not null
- from_stage            pipeline_stage
- to_stage              pipeline_stage
- actor_user_id         uuid fk users(id)
- data                  jsonb
- created_at            timestamptz not null default now()

Indexes:
  index (pipeline_item_id, created_at desc)

Enum pipeline_event_type:
  CREATED, STAGE_CHANGED, NOTE_ADDED, CHECKLIST_UPDATED,
  SUBMISSION_RECORDED, OUTCOME_RECORDED

### checklists
- id                    uuid pk
- pipeline_item_id      uuid fk pipeline_items(id) on delete cascade
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

### checklist_items
- id                    uuid pk
- checklist_id          uuid fk checklists(id) on delete cascade
- label                 text not null
- description           text
- is_required           boolean not null default true
- completed             boolean not null default false
- completed_at          timestamptz
- order_index           int not null default 0
- source                requirement_source not null
- created_at            timestamptz not null default now()

Indexes:
  index (checklist_id, order_index)

### pipeline_notes
- id                    uuid pk
- pipeline_item_id      uuid fk pipeline_items(id) on delete cascade
- author_user_id        uuid fk users(id)
- body                  text not null
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  index (pipeline_item_id, created_at desc)

---

## 9. Notifications

### notifications
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- type                  notification_type not null
- title                 text not null
- body                  text
- data                  jsonb
- opportunity_id        uuid fk opportunities(id)
- source_id             uuid fk sources(id)
- read_at               timestamptz
- created_at            timestamptz not null default now()

Indexes:
  index (user_id, created_at desc)
  index (user_id, read_at)
  index (type)

Enum notification_type:
  NEW_MATCH, DEADLINE_SOON, DEADLINE_CHANGED, REQUIREMENT_CHANGED,
  OPPORTUNITY_UPDATED, OPPORTUNITY_EXPIRED, SOURCE_FAILED,
  SOURCE_HEALTH_WARNING, PIPELINE_REMINDER, SYSTEM

### notification_preferences
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- channel               notification_channel not null
- type                  notification_type not null
- enabled               boolean not null default true
- created_at            timestamptz not null default now()

Indexes:
  unique (user_id, channel, type)

Enum notification_channel:
  IN_APP, EMAIL, PUSH, WEBHOOK

### notification_deliveries
- id                    uuid pk
- notification_id       uuid fk notifications(id) on delete cascade
- channel               notification_channel not null
- status                delivery_status not null default 'PENDING'
- attempts              int not null default 0
- last_attempt_at       timestamptz
- error_message         text
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Enum delivery_status:
  PENDING, SENT, FAILED, SKIPPED

### push_subscriptions
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- endpoint              text not null
- keys                  jsonb not null
- user_agent            text
- created_at            timestamptz not null default now()

Indexes:
  unique (user_id, endpoint)

---

## 10. Platform

### api_keys
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- name                  text not null
- prefix                text not null
- key_hash              text not null unique
- scopes                text[] not null default '{}'
- rate_limit_per_min    int not null default 60
- last_used_at          timestamptz
- expires_at            timestamptz
- revoked_at            timestamptz
- created_at            timestamptz not null default now()

Indexes:
  unique (key_hash)
  index (user_id)
  index (prefix)

### api_key_usage_daily
- id                    uuid pk
- api_key_id            uuid fk api_keys(id) on delete cascade
- day                   date not null
- requests              int not null default 0
- errors                int not null default 0
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  unique (api_key_id, day)

### webhook_endpoints
Outbound webhooks owned by users.
- id                    uuid pk
- user_id               uuid fk users(id) on delete cascade
- url                   text not null
- secret_hash           text not null
- events                text[] not null
- active                boolean not null default true
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  index (user_id)

### webhook_deliveries
- id                    uuid pk
- endpoint_id           uuid fk webhook_endpoints(id) on delete cascade
- event                 text not null
- payload               jsonb not null
- status                delivery_status not null default 'PENDING'
- attempts              int not null default 0
- response_status       int
- response_body         text
- last_attempt_at       timestamptz
- next_attempt_at       timestamptz
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

Indexes:
  index (endpoint_id, created_at desc)
  index (status, next_attempt_at)

### audit_logs
- id                    uuid pk
- actor_user_id         uuid fk users(id)
- actor_api_key_id      uuid fk api_keys(id)
- action                text not null
- entity_type           text
- entity_id             text
- ip_address            inet
- user_agent            text
- data                  jsonb
- created_at            timestamptz not null default now()

Indexes:
  index (actor_user_id, created_at desc)
  index (action)
  index (entity_type, entity_id)
  index (created_at desc)

### system_settings
- id                    uuid pk
- key                   text unique not null
- value                 jsonb not null
- description           text
- updated_by            uuid fk users(id)
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

### feature_flags
- id                    uuid pk
- key                   text unique not null
- enabled               boolean not null default false
- description           text
- updated_by            uuid fk users(id)
- created_at            timestamptz not null default now()
- updated_at            timestamptz not null default now()

### job_runs
Observability for scheduled jobs.
- id                    uuid pk
- job_name              text not null
- status                job_status not null
- started_at            timestamptz not null
- finished_at           timestamptz
- duration_ms           int
- items_processed       int
- error_message         text
- data                  jsonb
- created_at            timestamptz not null default now()

Indexes:
  index (job_name, started_at desc)
  index (status)

Enum job_status:
  RUNNING, SUCCEEDED, FAILED

### system_health_snapshots
- id                    uuid pk
- captured_at           timestamptz not null default now()
- db_ok                 boolean not null
- redis_ok              boolean not null
- apify_ok              boolean not null
- ai_ok                 boolean not null
- queue_depth           int
- worker_count          int
- details               jsonb

Indexes:
  index (captured_at desc)

---

## Seeding policy

Seeded (reference data only):
  - roles and permissions
  - categories and subcategories
  - countries and locations
  - currencies
  - notification templates
  - system settings defaults
  - feature flags defaults
  - match weights for each user type
  - one super admin account provisioned from environment variables

Never seeded:
  - opportunities
  - sources (added via admin once an adapter exists)
  - matches
  - notifications
  - analytics
  - any fabricated statistic

---

## Search and indexing strategy

Full-text search:
  opportunities.search_vector (title, organization_name, location_text,
  description, eligibility, requirements) with GIN index.

Trigram:
  pg_trgm extension; trigram indexes on opportunities.title and
  organizations.name to support deduplication and fuzzy search.

Composite indexes for the primary discovery query pattern:
  (country_code, category, deadline)
  (status, deadline)
  (system_state, deadline)

Partial index:
  opportunities where status = 'PUBLISHED'