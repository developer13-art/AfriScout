ALTER TABLE "bounties"
  ALTER COLUMN "reward_amount" TYPE DECIMAL(20, 9),
  ADD COLUMN "payout_reservation_id" TEXT,
  ADD COLUMN "payout_submission_id" UUID,
  ADD COLUMN "payout_reserved_by_user_id" UUID,
  ADD COLUMN "payout_reserved_at" TIMESTAMP(3);

ALTER TABLE "opportunities"
  ALTER COLUMN "value_min" TYPE DECIMAL(20, 9),
  ALTER COLUMN "value_max" TYPE DECIMAL(20, 9);

ALTER TABLE "opportunity_submissions"
  ADD COLUMN "reward_tx_signature" TEXT;

CREATE UNIQUE INDEX "opportunity_submissions_reward_tx_signature_key"
  ON "opportunity_submissions"("reward_tx_signature");

CREATE TABLE "opportunity_provenance_proofs" (
  "id" UUID NOT NULL,
  "opportunity_id" UUID NOT NULL,
  "content_hash" TEXT NOT NULL,
  "source_hash" TEXT NOT NULL,
  "wallet_address" TEXT NOT NULL,
  "tx_signature" TEXT NOT NULL,
  "anchored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "opportunity_provenance_proofs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "opportunity_provenance_proofs_tx_signature_key"
  ON "opportunity_provenance_proofs"("tx_signature");
CREATE UNIQUE INDEX "opportunity_provenance_proofs_opportunity_id_content_hash_key"
  ON "opportunity_provenance_proofs"("opportunity_id", "content_hash");
CREATE INDEX "opportunity_provenance_proofs_opportunity_id_anchored_at_idx"
  ON "opportunity_provenance_proofs"("opportunity_id", "anchored_at" DESC);

ALTER TABLE "opportunity_provenance_proofs"
  ADD CONSTRAINT "opportunity_provenance_proofs_opportunity_id_fkey"
  FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verified_achievements"
  ADD COLUMN "proof_tx_signature" TEXT,
  ADD COLUMN "proof_wallet_address" TEXT,
  ADD COLUMN "proof_anchored_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "verified_achievements_proof_tx_signature_key"
  ON "verified_achievements"("proof_tx_signature");
