CREATE TYPE "CommunityPostKind" AS ENUM (
  'GENERAL',
  'OPPORTUNITY_DISCUSSION',
  'QUESTION',
  'ACHIEVEMENT',
  'PROJECT_ANNOUNCEMENT',
  'EDUCATIONAL',
  'INDUSTRY_DISCUSSION'
);
CREATE TYPE "CommunityReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'RESOLVED', 'DISMISSED');
CREATE TYPE "CommunityActionKind" AS ENUM ('BLOCK', 'MUTE');

CREATE TABLE "community_posts" (
  "id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "opportunity_id" UUID,
  "kind" "CommunityPostKind" NOT NULL DEFAULT 'GENERAL',
  "content" VARCHAR(5000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "community_comments" (
  "id" UUID NOT NULL,
  "post_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "content" VARCHAR(2000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "community_reactions" (
  "id" UUID NOT NULL,
  "post_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_reactions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "community_follows" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "target_type" VARCHAR(24) NOT NULL,
  "target_key" VARCHAR(160) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_follows_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "community_reports" (
  "id" UUID NOT NULL,
  "reporter_id" UUID NOT NULL,
  "post_id" UUID,
  "comment_id" UUID,
  "reported_user_id" UUID,
  "reason" VARCHAR(80) NOT NULL,
  "details" VARCHAR(1000),
  "status" "CommunityReportStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "community_user_actions" (
  "id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "target_id" UUID NOT NULL,
  "kind" "CommunityActionKind" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_user_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "community_posts_created_at_idx" ON "community_posts"("created_at" DESC);
CREATE INDEX "community_posts_author_id_created_at_idx" ON "community_posts"("author_id", "created_at" DESC);
CREATE INDEX "community_posts_opportunity_id_created_at_idx" ON "community_posts"("opportunity_id", "created_at" DESC);
CREATE INDEX "community_comments_post_id_created_at_idx" ON "community_comments"("post_id", "created_at");
CREATE UNIQUE INDEX "community_reactions_post_id_user_id_key" ON "community_reactions"("post_id", "user_id");
CREATE INDEX "community_reactions_user_id_idx" ON "community_reactions"("user_id");
CREATE UNIQUE INDEX "community_follows_user_id_target_type_target_key_key" ON "community_follows"("user_id", "target_type", "target_key");
CREATE INDEX "community_follows_target_type_target_key_idx" ON "community_follows"("target_type", "target_key");
CREATE INDEX "community_reports_status_created_at_idx" ON "community_reports"("status", "created_at");
CREATE INDEX "community_reports_reporter_id_created_at_idx" ON "community_reports"("reporter_id", "created_at");
CREATE UNIQUE INDEX "community_user_actions_actor_id_target_id_kind_key" ON "community_user_actions"("actor_id", "target_id", "kind");
CREATE INDEX "community_user_actions_target_id_kind_idx" ON "community_user_actions"("target_id", "kind");

ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_opportunity_id_fkey"
  FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_follows" ADD CONSTRAINT "community_follows_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporter_id_fkey"
  FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_comment_id_fkey"
  FOREIGN KEY ("comment_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reported_user_id_fkey"
  FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "community_user_actions" ADD CONSTRAINT "community_user_actions_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_user_actions" ADD CONSTRAINT "community_user_actions_target_id_fkey"
  FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
