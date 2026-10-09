ALTER TABLE "opportunity_submissions"
ADD COLUMN "submission_proof_tx_signature" TEXT;

ALTER TABLE "opportunity_submissions"
ADD COLUMN "submission_draft_hash" TEXT;

CREATE UNIQUE INDEX "opportunity_submissions_submission_proof_tx_signature_key"
ON "opportunity_submissions"("submission_proof_tx_signature");
