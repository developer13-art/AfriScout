-- CreateEnum
CREATE TYPE "CommunityConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "OpportunityInteractionType" AS ENUM ('LIKE', 'INTERESTED', 'APPLYING', 'COMPLETED', 'SHARE');

-- AlterTable
ALTER TABLE "community_posts" ADD COLUMN     "community_slug" TEXT,
ADD COLUMN     "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "organization_id" UUID,
ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "community_reports" ADD COLUMN     "opportunity_id" UUID,
ADD COLUMN     "organization_id" UUID;

-- AlterTable
ALTER TABLE "source_suggestions" ADD COLUMN     "normalized_url" TEXT,
ADD COLUMN     "source_discovery_run_id" UUID;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "education_history" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "experience_history" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "saved_interests" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "source_discovery_runs" (
    "id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "apify_run_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minimum_score" INTEGER NOT NULL DEFAULT 60,
    "queries" JSONB NOT NULL DEFAULT '[]',
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "processed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_discovery_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_spaces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "country_code" CHAR(2),
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_connections" (
    "id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "status" "CommunityConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "community_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_analyses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "profile_hash" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_interactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "kind" "OpportunityInteractionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_verifications" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "wallet_address" TEXT,
    "tx_signature" TEXT,
    "anchored_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "source_discovery_runs_apify_run_id_key" ON "source_discovery_runs"("apify_run_id");

-- CreateIndex
CREATE INDEX "source_discovery_runs_requested_by_created_at_idx" ON "source_discovery_runs"("requested_by", "created_at" DESC);

-- CreateIndex
CREATE INDEX "source_discovery_runs_status_idx" ON "source_discovery_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "community_spaces_slug_key" ON "community_spaces"("slug");

-- CreateIndex
CREATE INDEX "community_connections_recipient_id_status_created_at_idx" ON "community_connections"("recipient_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "community_connections_requester_id_status_created_at_idx" ON "community_connections"("requester_id", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "community_connections_requester_id_recipient_id_key" ON "community_connections"("requester_id", "recipient_id");

-- CreateIndex
CREATE INDEX "profile_analyses_user_id_created_at_idx" ON "profile_analyses"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "opportunity_interactions_opportunity_id_kind_idx" ON "opportunity_interactions"("opportunity_id", "kind");

-- CreateIndex
CREATE INDEX "opportunity_interactions_user_id_created_at_idx" ON "opportunity_interactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_interactions_user_id_opportunity_id_kind_key" ON "opportunity_interactions"("user_id", "opportunity_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "source_verifications_tx_signature_key" ON "source_verifications"("tx_signature");

-- CreateIndex
CREATE INDEX "source_verifications_source_id_created_at_idx" ON "source_verifications"("source_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "source_verifications_source_id_version_key" ON "source_verifications"("source_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "source_suggestions_normalized_url_key" ON "source_suggestions"("normalized_url");

-- AddForeignKey
ALTER TABLE "source_suggestions" ADD CONSTRAINT "source_suggestions_source_discovery_run_id_fkey" FOREIGN KEY ("source_discovery_run_id") REFERENCES "source_discovery_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_discovery_runs" ADD CONSTRAINT "source_discovery_runs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_community_slug_fkey" FOREIGN KEY ("community_slug") REFERENCES "community_spaces"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_connections" ADD CONSTRAINT "community_connections_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_connections" ADD CONSTRAINT "community_connections_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_analyses" ADD CONSTRAINT "profile_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_interactions" ADD CONSTRAINT "opportunity_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_interactions" ADD CONSTRAINT "opportunity_interactions_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_verifications" ADD CONSTRAINT "source_verifications_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
