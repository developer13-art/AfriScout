/*
  Warnings:

  - You are about to drop the `rate_limit_windows` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "VerificationBatchStatus" AS ENUM ('PENDING', 'ROOT_READY', 'ANCHORED', 'FAILED');

-- CreateEnum
CREATE TYPE "OpportunityVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'PARTIAL', 'DISPUTED');

-- AlterTable
ALTER TABLE "sources" ADD COLUMN     "official_source" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trusted" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "rate_limit_windows";

-- CreateTable
CREATE TABLE "verification_batches" (
    "id" UUID NOT NULL,
    "source_run_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "root_hash" TEXT NOT NULL,
    "record_count" INTEGER NOT NULL,
    "status" "VerificationBatchStatus" NOT NULL DEFAULT 'PENDING',
    "solana_signature" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_verifications" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "status" "OpportunityVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "source_confidence" DECIMAL(5,3),
    "ai_confidence" DECIMAL(5,3),
    "data_completeness" DECIMAL(5,3),
    "merkle_proof" JSONB NOT NULL,
    "solana_tx" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_batches_source_run_id_key" ON "verification_batches"("source_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_batches_solana_signature_key" ON "verification_batches"("solana_signature");

-- CreateIndex
CREATE INDEX "verification_batches_status_created_at_idx" ON "verification_batches"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "opportunity_verifications_opportunity_id_idx" ON "opportunity_verifications"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunity_verifications_batch_id_status_idx" ON "opportunity_verifications"("batch_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_verifications_batch_id_opportunity_id_key" ON "opportunity_verifications"("batch_id", "opportunity_id");

-- AddForeignKey
ALTER TABLE "verification_batches" ADD CONSTRAINT "verification_batches_source_run_id_fkey" FOREIGN KEY ("source_run_id") REFERENCES "source_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_verifications" ADD CONSTRAINT "opportunity_verifications_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_verifications" ADD CONSTRAINT "opportunity_verifications_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "verification_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
