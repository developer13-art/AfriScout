CREATE TYPE "WorkspaceType" AS ENUM ('PERSONAL', 'ORGANIZATION', 'DEVELOPER');

ALTER TABLE "users"
  ADD COLUMN "city" TEXT;

ALTER TABLE "user_profiles"
  ADD COLUMN "username" TEXT,
  ADD COLUMN "workspace_intent" "WorkspaceType" NOT NULL DEFAULT 'PERSONAL',
  ADD COLUMN "professional_identities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX "user_profiles_username_key"
  ON "user_profiles"("username");

CREATE TABLE "workspaces" (
  "id" UUID NOT NULL,
  "owner_user_id" UUID NOT NULL,
  "type" "WorkspaceType" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "use_case" TEXT,
  "organization_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspaces_organization_id_key"
  ON "workspaces"("organization_id");
CREATE INDEX "workspaces_owner_user_id_type_idx"
  ON "workspaces"("owner_user_id", "type");

ALTER TABLE "workspaces"
  ADD CONSTRAINT "workspaces_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "workspaces_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "workspaces"
  ("id", "owner_user_id", "type", "name", "created_at", "updated_at")
SELECT
  gen_random_uuid(), "id", 'PERSONAL', 'Personal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users";

INSERT INTO "workspaces"
  ("id", "owner_user_id", "type", "name", "description", "organization_id", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  members."user_id",
  'ORGANIZATION',
  organizations."name",
  organizations."description",
  organizations."id",
  organizations."created_at",
  organizations."updated_at"
FROM "organizations"
JOIN "organization_members" AS members
  ON members."organization_id" = organizations."id"
 AND members."role" = 'OWNER';
