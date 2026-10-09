CREATE TABLE "media_images" (
  "id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "mime_type" VARCHAR(32) NOT NULL,
  "data" BYTEA NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "media_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "media_images_owner_id_created_at_idx" ON "media_images"("owner_id", "created_at");

ALTER TABLE "media_images"
  ADD CONSTRAINT "media_images_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
