ALTER TABLE "user_profiles"
  ADD COLUMN "cover_image_url" TEXT;

CREATE TABLE "community_conversations" (
  "id" UUID NOT NULL,
  "user_a_id" UUID NOT NULL,
  "user_b_id" UUID NOT NULL,
  "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "community_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_messages" (
  "id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "sender_id" UUID NOT NULL,
  "recipient_id" UUID NOT NULL,
  "body" VARCHAR(4000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "read_at" TIMESTAMP(3),

  CONSTRAINT "community_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "community_conversations_user_a_id_user_b_id_key"
  ON "community_conversations"("user_a_id", "user_b_id");
CREATE INDEX "community_conversations_user_a_id_last_message_at_idx"
  ON "community_conversations"("user_a_id", "last_message_at" DESC);
CREATE INDEX "community_conversations_user_b_id_last_message_at_idx"
  ON "community_conversations"("user_b_id", "last_message_at" DESC);
CREATE INDEX "community_messages_conversation_id_created_at_idx"
  ON "community_messages"("conversation_id", "created_at" DESC);
CREATE INDEX "community_messages_recipient_id_read_at_created_at_idx"
  ON "community_messages"("recipient_id", "read_at", "created_at");

ALTER TABLE "community_conversations"
  ADD CONSTRAINT "community_conversations_user_a_id_fkey"
  FOREIGN KEY ("user_a_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_conversations"
  ADD CONSTRAINT "community_conversations_user_b_id_fkey"
  FOREIGN KEY ("user_b_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_messages"
  ADD CONSTRAINT "community_messages_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "community_conversations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_messages"
  ADD CONSTRAINT "community_messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_messages"
  ADD CONSTRAINT "community_messages_recipient_id_fkey"
  FOREIGN KEY ("recipient_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
