CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'PRIVATE');

ALTER TABLE "user_profiles"
  ADD COLUMN "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN "visibility_rules" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "analyzable" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "user_profiles_visibility_idx" ON "user_profiles"("visibility");
