ALTER TABLE "matches"
  ADD COLUMN "ai_match_qualification" TEXT,
  ADD COLUMN "ai_match_reason" TEXT,
  ADD COLUMN "ai_match_provider" TEXT,
  ADD COLUMN "ai_match_error" TEXT,
  ADD COLUMN "ai_match_analyzed_at" TIMESTAMP(3);
