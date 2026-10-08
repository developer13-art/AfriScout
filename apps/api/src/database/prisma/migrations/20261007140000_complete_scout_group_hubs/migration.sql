CREATE TYPE "CommunitySpaceEventStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "CommunitySpaceEventRsvpStatus" AS ENUM ('GOING', 'INTERESTED');
CREATE TYPE "CommunitySpaceProjectStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
ALTER TYPE "CommunityPostKind" ADD VALUE 'ANNOUNCEMENT';
ALTER TYPE "CommunitySpaceMemberStatus" ADD VALUE 'MUTED';

ALTER TABLE "community_spaces"
  ADD COLUMN "join_questions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "community_space_members"
  ADD COLUMN "join_answers" JSONB;
ALTER TABLE "community_posts"
  ADD COLUMN "removed_at" TIMESTAMP(3),
  ADD COLUMN "locked_at" TIMESTAMP(3),
  ADD COLUMN "moderation_note" VARCHAR(500);
ALTER TABLE "community_comments"
  ADD COLUMN "removed_at" TIMESTAMP(3);

CREATE TABLE "community_space_events" (
  "id" UUID NOT NULL,
  "space_id" UUID NOT NULL,
  "creator_id" UUID NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "description" VARCHAR(3000) NOT NULL,
  "kind" VARCHAR(40) NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3),
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "location" TEXT,
  "meeting_url" TEXT,
  "capacity" INTEGER,
  "status" "CommunitySpaceEventStatus" NOT NULL DEFAULT 'SCHEDULED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_space_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "community_space_events_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "community_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "community_space_events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "community_space_events_space_id_starts_at_idx" ON "community_space_events"("space_id", "starts_at");

CREATE TABLE "community_space_event_rsvps" (
  "id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" "CommunitySpaceEventRsvpStatus" NOT NULL DEFAULT 'INTERESTED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_space_event_rsvps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "community_space_event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "community_space_events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "community_space_event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "community_space_event_rsvps_event_id_user_id_key" ON "community_space_event_rsvps"("event_id", "user_id");
CREATE INDEX "community_space_event_rsvps_user_id_created_at_idx" ON "community_space_event_rsvps"("user_id", "created_at");

CREATE TABLE "community_space_projects" (
  "id" UUID NOT NULL,
  "space_id" UUID NOT NULL,
  "creator_id" UUID NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "description" VARCHAR(3000) NOT NULL,
  "status" "CommunitySpaceProjectStatus" NOT NULL DEFAULT 'OPEN',
  "skills_needed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_space_projects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "community_space_projects_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "community_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "community_space_projects_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "community_space_projects_space_id_status_created_at_idx" ON "community_space_projects"("space_id", "status", "created_at" DESC);

CREATE TABLE "community_space_project_members" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" VARCHAR(40) NOT NULL DEFAULT 'CONTRIBUTOR',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_space_project_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "community_space_project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "community_space_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "community_space_project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "community_space_project_members_project_id_user_id_key" ON "community_space_project_members"("project_id", "user_id");
CREATE INDEX "community_space_project_members_user_id_created_at_idx" ON "community_space_project_members"("user_id", "created_at");

CREATE TABLE "community_space_invites" (
  "id" UUID NOT NULL,
  "space_id" UUID NOT NULL,
  "created_by_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3),
  "max_uses" INTEGER,
  "use_count" INTEGER NOT NULL DEFAULT 0,
  "approval_required" BOOLEAN NOT NULL DEFAULT false,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_space_invites_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "community_space_invites_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "community_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "community_space_invites_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "community_space_invites_token_hash_key" ON "community_space_invites"("token_hash");
CREATE INDEX "community_space_invites_space_id_created_at_idx" ON "community_space_invites"("space_id", "created_at");
