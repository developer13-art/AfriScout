CREATE TABLE "background_jobs" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "locked_until" TIMESTAMP(3),
    "lock_token" UUID,
    "last_error" TEXT,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "background_jobs_status_run_at_created_at_idx"
    ON "background_jobs"("status", "run_at", "created_at");
CREATE INDEX "background_jobs_locked_until_idx"
    ON "background_jobs"("locked_until");

CREATE TABLE "rate_limit_windows" (
    "key" VARCHAR(255) NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "rate_limit_windows_pkey" PRIMARY KEY ("key", "window_start")
);
CREATE INDEX "rate_limit_windows_window_start_idx"
    ON "rate_limit_windows"("window_start");
