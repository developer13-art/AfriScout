ALTER TABLE "community_posts"
  ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "community_messages"
  ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE "media_attachments" (
  "id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "filename" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "media_attachments_owner_id_created_at_idx"
  ON "media_attachments"("owner_id", "created_at");

ALTER TABLE "media_attachments"
  ADD CONSTRAINT "media_attachments_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
