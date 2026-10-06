CREATE TYPE "WalletChallengePurpose" AS ENUM ('LOGIN', 'LINK');

ALTER TABLE "users"
  ADD COLUMN "wallet_address" TEXT,
  ADD COLUMN "wallet_verified_at" TIMESTAMP(3),
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "password_hash" DROP NOT NULL;

CREATE UNIQUE INDEX "users_wallet_address_key"
  ON "users"("wallet_address");

CREATE TABLE "wallet_challenges" (
  "id" UUID NOT NULL,
  "wallet_address" TEXT NOT NULL,
  "user_id" UUID,
  "purpose" "WalletChallengePurpose" NOT NULL,
  "nonce" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_challenges_nonce_key"
  ON "wallet_challenges"("nonce");
CREATE INDEX "wallet_challenges_wallet_address_expires_at_idx"
  ON "wallet_challenges"("wallet_address", "expires_at");

ALTER TABLE "wallet_challenges"
  ADD CONSTRAINT "wallet_challenges_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
