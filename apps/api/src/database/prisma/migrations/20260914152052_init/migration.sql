-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'DATA_ADMIN', 'USER', 'API_DEVELOPER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('BUSINESS', 'PROFESSIONAL', 'STUDENT', 'RESEARCHER', 'NGO', 'STARTUP', 'OTHER');

-- CreateEnum
CREATE TYPE "RemotePreference" AS ENUM ('ONSITE', 'REMOTE', 'HYBRID', 'ANY');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('GOVERNMENT', 'PROCUREMENT_PORTAL', 'UNIVERSITY', 'NGO', 'FOUNDATION', 'ACCELERATOR', 'GRANT_PORTAL', 'JOB_BOARD', 'SCHOLARSHIP_PORTAL', 'DEVELOPMENT_ORG', 'PRIVATE_COMPANY', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceHealth" AS ENUM ('UNKNOWN', 'HEALTHY', 'WARNING', 'FAILED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CrawlFrequency" AS ENUM ('EVERY_6_HOURS', 'EVERY_12_HOURS', 'DAILY', 'WEEKLY', 'MANUAL');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('SUGGESTED', 'REVIEWED', 'VERIFIED', 'ACTIVATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "RunTrigger" AS ENUM ('SCHEDULE', 'MANUAL_ADMIN', 'WEBHOOK', 'RETRY');

-- CreateEnum
CREATE TYPE "RawStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SystemLifecycle" AS ENUM ('DISCOVERED', 'RAW', 'NORMALIZED', 'VALIDATED', 'DEDUPLICATED', 'VERIFIED', 'ANALYZED', 'PUBLISHED', 'MONITORED', 'UPDATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PARTIAL', 'VERIFIED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "RequirementKind" AS ENUM ('DOCUMENT', 'EXPERIENCE', 'CERTIFICATION', 'FINANCIAL', 'TECHNICAL', 'ELIGIBILITY', 'GEOGRAPHIC', 'LEGAL', 'OTHER');

-- CreateEnum
CREATE TYPE "RequirementSource" AS ENUM ('SOURCE_FACT', 'AI_INTERPRETATION');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'FETCHING', 'EXTRACTING', 'EXTRACTED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ChangeSeverity" AS ENUM ('NORMAL', 'IMPORTANT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('GOVERNMENT', 'PRIVATE', 'NGO', 'FOUNDATION', 'UNIVERSITY', 'DEVELOPMENT', 'ACCELERATOR', 'INCUBATOR', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'GEMINI', 'MOCK');

-- CreateEnum
CREATE TYPE "AiTaskType" AS ENUM ('CLASSIFICATION', 'SUMMARY', 'ELIGIBILITY', 'REQUIREMENTS', 'DOCUMENT', 'RISK', 'RECOMMENDATIONS', 'ANALYST', 'SEARCH_INTENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AiStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'FALLBACK_USED');

-- CreateEnum
CREATE TYPE "MatchBand" AS ENUM ('VERY_STRONG', 'STRONG', 'MODERATE', 'WEAK', 'POOR');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('DISCOVERED', 'REVIEWING', 'QUALIFIED', 'PREPARING', 'SUBMITTED', 'UNDER_REVIEW', 'WON', 'LOST', 'WITHDRAWN', 'DISQUALIFIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OutcomeType" AS ENUM ('WON', 'LOST', 'WITHDRAWN', 'DISQUALIFIED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "PipelineEventType" AS ENUM ('CREATED', 'STAGE_CHANGED', 'NOTE_ADDED', 'CHECKLIST_UPDATED', 'SUBMISSION_RECORDED', 'OUTCOME_RECORDED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_MATCH', 'DEADLINE_SOON', 'DEADLINE_CHANGED', 'REQUIREMENT_CHANGED', 'OPPORTUNITY_UPDATED', 'OPPORTUNITY_EXPIRED', 'SOURCE_FAILED', 'SOURCE_HEALTH_WARNING', 'PIPELINE_REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "country_code" CHAR(2),
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(3),
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_type" "UserType" NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timezone" TEXT,
    "preferred_currency" CHAR(3),
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "registration_number" TEXT,
    "industry" TEXT,
    "employees_count" INTEGER,
    "annual_revenue" DECIMAL(20,2),
    "annual_revenue_currency" CHAR(3),
    "website" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "education_level" TEXT,
    "field_of_study" TEXT,
    "institution" TEXT,
    "graduation_year" INTEGER,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "profession" TEXT,
    "seniority" TEXT,
    "years_experience" INTEGER,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "portfolio_url" TEXT,
    "linkedin_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role" "UserRole" NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role","permission_id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "notify_deadline" BOOLEAN NOT NULL DEFAULT true,
    "notify_changes" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_opportunities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dna_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remote_preference" "RemotePreference",
    "currency" CHAR(3),
    "min_value" DECIMAL(20,2),
    "max_value" DECIMAL(20,2),
    "eligibility_notes" TEXT,
    "experience_notes" TEXT,
    "opportunity_types" TEXT[],
    "opportunity_categories" TEXT[],
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extra" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dna_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dna_capabilities" (
    "id" UUID NOT NULL,
    "dna_profile_id" UUID NOT NULL,
    "capability" TEXT NOT NULL,
    "strength" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dna_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country_code" CHAR(2),
    "region" TEXT,
    "language" TEXT,
    "currency" CHAR(3),
    "category" TEXT,
    "source_type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "adapter" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "crawl_frequency" "CrawlFrequency" NOT NULL DEFAULT 'DAILY',
    "attribution_required" BOOLEAN NOT NULL DEFAULT true,
    "terms_url" TEXT,
    "notes" TEXT,
    "health" "SourceHealth" NOT NULL DEFAULT 'UNKNOWN',
    "last_success_at" TIMESTAMP(3),
    "last_failure_at" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "items_total" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_adapters" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_adapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_runs" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "actor_id" TEXT,
    "apify_run_id" TEXT,
    "apify_dataset_id" TEXT,
    "status" "RunStatus" NOT NULL,
    "trigger" "RunTrigger" NOT NULL,
    "items_found" INTEGER NOT NULL DEFAULT 0,
    "items_imported" INTEGER NOT NULL DEFAULT 0,
    "items_updated" INTEGER NOT NULL DEFAULT 0,
    "items_duplicate" INTEGER NOT NULL DEFAULT 0,
    "items_invalid" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "error_details" JSONB,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_suggestions" (
    "id" UUID NOT NULL,
    "suggested_by" UUID,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "country_code" CHAR(2),
    "category" TEXT,
    "notes" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'SUGGESTED',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_opportunities" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "source_run_id" UUID,
    "apify_dataset_item_id" TEXT,
    "payload" JSONB NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processing_status" "RawStatus" NOT NULL DEFAULT 'PENDING',
    "processing_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "organization_id" UUID,
    "organization_name" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "opportunity_type" TEXT NOT NULL,
    "country_code" CHAR(2),
    "region" TEXT,
    "city" TEXT,
    "location_text" TEXT,
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "summary_short" TEXT,
    "value_min" DECIMAL(20,2),
    "value_max" DECIMAL(20,2),
    "currency" CHAR(3),
    "published_at" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "deadline_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "eligibility" TEXT,
    "requirements" TEXT,
    "application_method" TEXT,
    "application_url" TEXT,
    "reference_number" TEXT,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'PUBLISHED',
    "system_state" "SystemLifecycle" NOT NULL DEFAULT 'PUBLISHED',
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "ai_processed" BOOLEAN NOT NULL DEFAULT false,
    "ai_processed_at" TIMESTAMP(3),
    "extra" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_sources" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "raw_opportunity_id" UUID,
    "source_url" TEXT NOT NULL,
    "source_title" TEXT,
    "published_at" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_documents" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "source_id" UUID,
    "url" TEXT NOT NULL,
    "file_name" TEXT,
    "mime_type" TEXT,
    "file_size" BIGINT,
    "checksum" TEXT,
    "fetched_at" TIMESTAMP(3),
    "extraction_status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "extraction_error" TEXT,
    "extracted_text" TEXT,
    "extracted_fields" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_requirements" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "kind" "RequirementKind" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "source" "RequirementSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_versions" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "snapshot_hash" TEXT NOT NULL,
    "created_by_run_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_changes" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "from_version" INTEGER,
    "to_version" INTEGER,
    "field" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "severity" "ChangeSeverity" NOT NULL DEFAULT 'NORMAL',
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_duplicates" (
    "id" UUID NOT NULL,
    "canonical_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "similarity" DECIMAL(5,4) NOT NULL,
    "signals" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_duplicates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_views" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "user_id" UUID,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,

    CONSTRAINT "opportunity_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "OrganizationType",
    "country_code" CHAR(2),
    "website" TEXT,
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID,
    "opportunity_version" INTEGER,
    "task_type" "AiTaskType" NOT NULL,
    "provider" "AiProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "output" JSONB NOT NULL,
    "output_text" TEXT,
    "confidence" DECIMAL(4,3),
    "tokens_input" INTEGER,
    "tokens_output" INTEGER,
    "cost_usd" DECIMAL(10,6),
    "latency_ms" INTEGER,
    "status" "AiStatus" NOT NULL DEFAULT 'SUCCEEDED',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompts" (
    "id" UUID NOT NULL,
    "task_type" "AiTaskType" NOT NULL,
    "version" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_daily" (
    "id" UUID NOT NULL,
    "day" DATE NOT NULL,
    "provider" "AiProvider" NOT NULL,
    "task_type" "AiTaskType" NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "tokens_input" BIGINT NOT NULL DEFAULT 0,
    "tokens_output" BIGINT NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_usage_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "dna_profile_id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "band" "MatchBand" NOT NULL,
    "breakdown" JSONB NOT NULL,
    "reasons" JSONB NOT NULL,
    "concerns" JSONB NOT NULL,
    "weights_version" TEXT NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_weights" (
    "id" UUID NOT NULL,
    "user_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "weights" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipelines" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_items" (
    "id" UUID NOT NULL,
    "pipeline_id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "stage" "PipelineStage" NOT NULL DEFAULT 'REVIEWING',
    "owner_user_id" UUID,
    "notes" TEXT,
    "submission_date" TIMESTAMP(3),
    "submission_reference" TEXT,
    "outcome_type" "OutcomeType",
    "outcome_value" DECIMAL(20,2),
    "outcome_currency" CHAR(3),
    "outcome_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_events" (
    "id" UUID NOT NULL,
    "pipeline_item_id" UUID NOT NULL,
    "type" "PipelineEventType" NOT NULL,
    "from_stage" "PipelineStage",
    "to_stage" "PipelineStage",
    "actor_user_id" UUID,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" UUID NOT NULL,
    "pipeline_item_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" UUID NOT NULL,
    "checklist_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "source" "RequirementSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_notes" (
    "id" UUID NOT NULL,
    "pipeline_item_id" UUID NOT NULL,
    "author_user_id" UUID,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "opportunity_id" UUID,
    "source_id" UUID,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rate_limit_per_min" INTEGER NOT NULL DEFAULT 60,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_usage_daily" (
    "id" UUID NOT NULL,
    "api_key_id" UUID NOT NULL,
    "day" DATE NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_usage_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "endpoint_id" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "response_status" INTEGER,
    "response_body" TEXT,
    "last_attempt_at" TIMESTAMP(3),
    "next_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "actor_api_key_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_runs" (
    "id" UUID NOT NULL,
    "job_name" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "items_processed" INTEGER,
    "error_message" TEXT,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_health_snapshots" (
    "id" UUID NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "db_ok" BOOLEAN NOT NULL,
    "redis_ok" BOOLEAN NOT NULL,
    "apify_ok" BOOLEAN NOT NULL,
    "ai_ok" BOOLEAN NOT NULL,
    "queue_depth" INTEGER,
    "worker_count" INTEGER,
    "details" JSONB,

    CONSTRAINT "system_health_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_user_id_key" ON "business_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_user_id_key" ON "professional_profiles"("user_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_hash_key" ON "password_resets"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_hash_key" ON "email_verifications"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "watchlists_user_id_idx" ON "watchlists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "watchlists_user_id_opportunity_id_key" ON "watchlists"("user_id", "opportunity_id");

-- CreateIndex
CREATE INDEX "saved_opportunities_user_id_created_at_idx" ON "saved_opportunities"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "saved_opportunities_user_id_opportunity_id_key" ON "saved_opportunities"("user_id", "opportunity_id");

-- CreateIndex
CREATE INDEX "dna_profiles_user_id_idx" ON "dna_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dna_profiles_user_id_version_key" ON "dna_profiles"("user_id", "version");

-- CreateIndex
CREATE INDEX "dna_capabilities_dna_profile_id_idx" ON "dna_capabilities"("dna_profile_id");

-- CreateIndex
CREATE INDEX "dna_capabilities_capability_idx" ON "dna_capabilities"("capability");

-- CreateIndex
CREATE UNIQUE INDEX "sources_slug_key" ON "sources"("slug");

-- CreateIndex
CREATE INDEX "sources_active_idx" ON "sources"("active");

-- CreateIndex
CREATE INDEX "sources_country_code_idx" ON "sources"("country_code");

-- CreateIndex
CREATE INDEX "sources_category_idx" ON "sources"("category");

-- CreateIndex
CREATE INDEX "sources_health_idx" ON "sources"("health");

-- CreateIndex
CREATE UNIQUE INDEX "source_adapters_key_key" ON "source_adapters"("key");

-- CreateIndex
CREATE INDEX "source_runs_source_id_created_at_idx" ON "source_runs"("source_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "source_runs_status_idx" ON "source_runs"("status");

-- CreateIndex
CREATE INDEX "source_runs_apify_run_id_idx" ON "source_runs"("apify_run_id");

-- CreateIndex
CREATE INDEX "raw_opportunities_source_id_idx" ON "raw_opportunities"("source_id");

-- CreateIndex
CREATE INDEX "raw_opportunities_processing_status_idx" ON "raw_opportunities"("processing_status");

-- CreateIndex
CREATE UNIQUE INDEX "raw_opportunities_payload_hash_source_id_key" ON "raw_opportunities"("payload_hash", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_slug_key" ON "opportunities"("slug");

-- CreateIndex
CREATE INDEX "opportunities_category_idx" ON "opportunities"("category");

-- CreateIndex
CREATE INDEX "opportunities_opportunity_type_idx" ON "opportunities"("opportunity_type");

-- CreateIndex
CREATE INDEX "opportunities_country_code_idx" ON "opportunities"("country_code");

-- CreateIndex
CREATE INDEX "opportunities_deadline_idx" ON "opportunities"("deadline");

-- CreateIndex
CREATE INDEX "opportunities_status_idx" ON "opportunities"("status");

-- CreateIndex
CREATE INDEX "opportunities_system_state_idx" ON "opportunities"("system_state");

-- CreateIndex
CREATE INDEX "opportunities_published_at_idx" ON "opportunities"("published_at" DESC);

-- CreateIndex
CREATE INDEX "opportunity_sources_opportunity_id_idx" ON "opportunity_sources"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunity_sources_source_id_idx" ON "opportunity_sources"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_sources_opportunity_id_source_id_source_url_key" ON "opportunity_sources"("opportunity_id", "source_id", "source_url");

-- CreateIndex
CREATE INDEX "opportunity_documents_opportunity_id_idx" ON "opportunity_documents"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunity_documents_extraction_status_idx" ON "opportunity_documents"("extraction_status");

-- CreateIndex
CREATE INDEX "opportunity_requirements_opportunity_id_idx" ON "opportunity_requirements"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunity_versions_opportunity_id_idx" ON "opportunity_versions"("opportunity_id");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_versions_opportunity_id_version_key" ON "opportunity_versions"("opportunity_id", "version");

-- CreateIndex
CREATE INDEX "opportunity_changes_opportunity_id_idx" ON "opportunity_changes"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunity_changes_detected_at_idx" ON "opportunity_changes"("detected_at" DESC);

-- CreateIndex
CREATE INDEX "opportunity_changes_notified_idx" ON "opportunity_changes"("notified");

-- CreateIndex
CREATE INDEX "opportunity_duplicates_canonical_id_idx" ON "opportunity_duplicates"("canonical_id");

-- CreateIndex
CREATE INDEX "opportunity_duplicates_candidate_id_idx" ON "opportunity_duplicates"("candidate_id");

-- CreateIndex
CREATE INDEX "opportunity_duplicates_status_idx" ON "opportunity_duplicates"("status");

-- CreateIndex
CREATE INDEX "opportunity_views_opportunity_id_idx" ON "opportunity_views"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunity_views_user_id_idx" ON "opportunity_views"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_country_code_idx" ON "organizations"("country_code");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "ai_analyses_opportunity_id_idx" ON "ai_analyses"("opportunity_id");

-- CreateIndex
CREATE INDEX "ai_analyses_task_type_idx" ON "ai_analyses"("task_type");

-- CreateIndex
CREATE INDEX "ai_analyses_provider_idx" ON "ai_analyses"("provider");

-- CreateIndex
CREATE INDEX "ai_analyses_created_at_idx" ON "ai_analyses"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ai_prompts_task_type_version_key" ON "ai_prompts"("task_type", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ai_usage_daily_day_provider_task_type_key" ON "ai_usage_daily"("day", "provider", "task_type");

-- CreateIndex
CREATE INDEX "matches_user_id_score_idx" ON "matches"("user_id", "score" DESC);

-- CreateIndex
CREATE INDEX "matches_opportunity_id_idx" ON "matches"("opportunity_id");

-- CreateIndex
CREATE INDEX "matches_band_idx" ON "matches"("band");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user_id_opportunity_id_dna_profile_id_key" ON "matches"("user_id", "opportunity_id", "dna_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_weights_user_type_version_key" ON "match_weights"("user_type", "version");

-- CreateIndex
CREATE INDEX "pipelines_user_id_idx" ON "pipelines"("user_id");

-- CreateIndex
CREATE INDEX "pipeline_items_pipeline_id_stage_idx" ON "pipeline_items"("pipeline_id", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_items_pipeline_id_opportunity_id_key" ON "pipeline_items"("pipeline_id", "opportunity_id");

-- CreateIndex
CREATE INDEX "pipeline_events_pipeline_item_id_created_at_idx" ON "pipeline_events"("pipeline_item_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "checklists_pipeline_item_id_key" ON "checklists"("pipeline_item_id");

-- CreateIndex
CREATE INDEX "checklist_items_checklist_id_order_index_idx" ON "checklist_items"("checklist_id", "order_index");

-- CreateIndex
CREATE INDEX "pipeline_notes_pipeline_item_id_created_at_idx" ON "pipeline_notes"("pipeline_item_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_channel_type_key" ON "notification_preferences"("user_id", "channel", "type");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_user_id_endpoint_key" ON "push_subscriptions"("user_id", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_prefix_idx" ON "api_keys"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_usage_daily_api_key_id_day_key" ON "api_key_usage_daily"("api_key_id", "day");

-- CreateIndex
CREATE INDEX "webhook_endpoints_user_id_idx" ON "webhook_endpoints"("user_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpoint_id_created_at_idx" ON "webhook_deliveries"("endpoint_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_next_attempt_at_idx" ON "webhook_deliveries"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "job_runs_job_name_started_at_idx" ON "job_runs"("job_name", "started_at" DESC);

-- CreateIndex
CREATE INDEX "job_runs_status_idx" ON "job_runs"("status");

-- CreateIndex
CREATE INDEX "system_health_snapshots_captured_at_idx" ON "system_health_snapshots"("captured_at" DESC);

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_opportunities" ADD CONSTRAINT "saved_opportunities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_opportunities" ADD CONSTRAINT "saved_opportunities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dna_profiles" ADD CONSTRAINT "dna_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dna_capabilities" ADD CONSTRAINT "dna_capabilities_dna_profile_id_fkey" FOREIGN KEY ("dna_profile_id") REFERENCES "dna_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_runs" ADD CONSTRAINT "source_runs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_runs" ADD CONSTRAINT "source_runs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_suggestions" ADD CONSTRAINT "source_suggestions_suggested_by_fkey" FOREIGN KEY ("suggested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_suggestions" ADD CONSTRAINT "source_suggestions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_opportunities" ADD CONSTRAINT "raw_opportunities_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_opportunities" ADD CONSTRAINT "raw_opportunities_source_run_id_fkey" FOREIGN KEY ("source_run_id") REFERENCES "source_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_sources" ADD CONSTRAINT "opportunity_sources_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_sources" ADD CONSTRAINT "opportunity_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_sources" ADD CONSTRAINT "opportunity_sources_raw_opportunity_id_fkey" FOREIGN KEY ("raw_opportunity_id") REFERENCES "raw_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_documents" ADD CONSTRAINT "opportunity_documents_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_documents" ADD CONSTRAINT "opportunity_documents_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_requirements" ADD CONSTRAINT "opportunity_requirements_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_versions" ADD CONSTRAINT "opportunity_versions_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_versions" ADD CONSTRAINT "opportunity_versions_created_by_run_id_fkey" FOREIGN KEY ("created_by_run_id") REFERENCES "source_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_changes" ADD CONSTRAINT "opportunity_changes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_dna_profile_id_fkey" FOREIGN KEY ("dna_profile_id") REFERENCES "dna_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_items" ADD CONSTRAINT "pipeline_items_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_items" ADD CONSTRAINT "pipeline_items_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_items" ADD CONSTRAINT "pipeline_items_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_events" ADD CONSTRAINT "pipeline_events_pipeline_item_id_fkey" FOREIGN KEY ("pipeline_item_id") REFERENCES "pipeline_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_events" ADD CONSTRAINT "pipeline_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_pipeline_item_id_fkey" FOREIGN KEY ("pipeline_item_id") REFERENCES "pipeline_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_notes" ADD CONSTRAINT "pipeline_notes_pipeline_item_id_fkey" FOREIGN KEY ("pipeline_item_id") REFERENCES "pipeline_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
