CREATE TYPE "BountyStatus" AS ENUM ('OPEN', 'PAUSED', 'AWARDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "BountyFundingStatus" AS ENUM ('UNFUNDED', 'PENDING', 'FUNDED', 'DISPUTED');
CREATE TYPE "SubmissionStatus" AS ENUM ('PARTICIPATING', 'SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE "bounties" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "opportunity_id" UUID NOT NULL,
  "created_by_user_id" UUID NOT NULL,
  "reward_amount" DECIMAL(20, 9) NOT NULL,
  "reward_currency" CHAR(3) NOT NULL,
  "required_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "BountyStatus" NOT NULL DEFAULT 'OPEN',
  "funding_status" "BountyFundingStatus" NOT NULL DEFAULT 'UNFUNDED',
  "funding_tx_signature" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bounties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "opportunity_submissions" (
  "id" UUID NOT NULL,
  "bounty_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "wallet_address" TEXT,
  "participation_tx_signature" TEXT,
  "submission_url" TEXT,
  "submission_text" TEXT,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'PARTICIPATING',
  "reviewed_by_user_id" UUID,
  "reviewed_at" TIMESTAMP(3),
  "review_note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "opportunity_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verified_achievements" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "issuer_user_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "opportunity_id" UUID NOT NULL,
  "submission_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "proof_hash" TEXT NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 25,
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verified_achievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bounties_opportunity_id_key"
  ON "bounties"("opportunity_id");
CREATE INDEX "bounties_organization_id_status_idx"
  ON "bounties"("organization_id", "status");
CREATE INDEX "bounties_funding_status_idx"
  ON "bounties"("funding_status");

CREATE UNIQUE INDEX "opportunity_submissions_participation_tx_signature_key"
  ON "opportunity_submissions"("participation_tx_signature");
CREATE UNIQUE INDEX "opportunity_submissions_bounty_id_user_id_key"
  ON "opportunity_submissions"("bounty_id", "user_id");
CREATE INDEX "opportunity_submissions_bounty_id_status_idx"
  ON "opportunity_submissions"("bounty_id", "status");
CREATE INDEX "opportunity_submissions_user_id_created_at_idx"
  ON "opportunity_submissions"("user_id", "created_at" DESC);

CREATE UNIQUE INDEX "verified_achievements_submission_id_key"
  ON "verified_achievements"("submission_id");
CREATE INDEX "verified_achievements_user_id_issued_at_idx"
  ON "verified_achievements"("user_id", "issued_at" DESC);
CREATE INDEX "verified_achievements_organization_id_idx"
  ON "verified_achievements"("organization_id");

ALTER TABLE "bounties"
  ADD CONSTRAINT "bounties_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "bounties_opportunity_id_fkey"
  FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "bounties_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "opportunity_submissions"
  ADD CONSTRAINT "opportunity_submissions_bounty_id_fkey"
  FOREIGN KEY ("bounty_id") REFERENCES "bounties"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "opportunity_submissions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "opportunity_submissions_reviewed_by_user_id_fkey"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "verified_achievements"
  ADD CONSTRAINT "verified_achievements_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "verified_achievements_issuer_user_id_fkey"
  FOREIGN KEY ("issuer_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "verified_achievements_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "verified_achievements_opportunity_id_fkey"
  FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "verified_achievements_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "opportunity_submissions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;