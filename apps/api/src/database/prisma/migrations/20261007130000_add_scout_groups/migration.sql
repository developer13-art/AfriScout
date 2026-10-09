CREATE TYPE "CommunitySpaceVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'HIDDEN');
CREATE TYPE "CommunitySpaceMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'CONTRIBUTOR', 'MEMBER');
CREATE TYPE "CommunitySpaceMemberStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED');

ALTER TABLE "community_spaces"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'General Community',
  ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "visibility" "CommunitySpaceVisibility" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'English',
  ADD COLUMN "profile_image_url" TEXT,
  ADD COLUMN "cover_image_url" TEXT;

CREATE INDEX "community_spaces_visibility_category_idx" ON "community_spaces"("visibility", "category");

CREATE TABLE "community_space_members" (
  "id" UUID NOT NULL,
  "space_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" "CommunitySpaceMemberRole" NOT NULL DEFAULT 'MEMBER',
  "status" "CommunitySpaceMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_space_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "community_space_members_space_id_user_id_key" ON "community_space_members"("space_id", "user_id");
CREATE INDEX "community_space_members_user_id_status_idx" ON "community_space_members"("user_id", "status");
CREATE INDEX "community_space_members_space_id_status_created_at_idx" ON "community_space_members"("space_id", "status", "created_at");

INSERT INTO "community_space_members" ("id", "space_id", "user_id", "role", "status", "created_at")
SELECT gen_random_uuid(), spaces."id", follows."user_id", 'MEMBER', 'ACTIVE', follows."created_at"
FROM "community_follows" AS follows
JOIN "community_spaces" AS spaces ON spaces."slug" = follows."target_key"
WHERE follows."target_type" = 'SPACE'
ON CONFLICT ("space_id", "user_id") DO NOTHING;

ALTER TABLE "community_space_members"
  ADD CONSTRAINT "community_space_members_space_id_fkey"
  FOREIGN KEY ("space_id") REFERENCES "community_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_space_members"
  ADD CONSTRAINT "community_space_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
