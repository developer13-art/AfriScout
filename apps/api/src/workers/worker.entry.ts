import { connectDatabase, disconnectDatabase } from "../config/database";
import { logger } from "../config/logger";
import { env } from "../config/env";
import { startPipelineWorker } from "../jobs/workers/pipeline.worker";
import { startMatchingWorker } from "../jobs/workers/matching.worker";
import { startNotificationWorker } from "../jobs/workers/notification.worker";
import { startApifyWorker } from "../jobs/workers/apify.worker";
import { startDocumentWorker } from "../jobs/workers/document.worker";
import { startMaintenanceWorker } from "../jobs/workers/maintenance.worker";
import { startWebhookWorker } from "../jobs/workers/webhook.worker";
import { tickSourceScheduler } from "../jobs/schedulers/sourceScheduler";
import { tickDeadlineScheduler } from "../jobs/schedulers/deadlineScheduler";
import { tickExpiryScheduler } from "../jobs/schedulers/expiryScheduler";
import { tickHealthScheduler } from "../jobs/schedulers/healthScheduler";
import { tickSourceSuggestionScheduler } from "../jobs/schedulers/sourceSuggestionScheduler";

async function bootstrap(): Promise<void> {
  logger.info(
    { concurrency: env.WORKER_CONCURRENCY, schedulerEnabled: env.SCHEDULER_ENABLED },
    "worker_starting",
  );

  await connectDatabase();

  const workers = [
    startPipelineWorker(),
    startMatchingWorker(),
    startNotificationWorker(),
    startApifyWorker(),
    startDocumentWorker(),
    startMaintenanceWorker(),
    startWebhookWorker(),
  ];

  logger.info({ count: workers.length }, "workers_started");

  if (env.SCHEDULER_ENABLED) {
    setInterval(() => {
      void tickSourceScheduler();
    }, 15 * 60 * 1000);

    setInterval(() => {
      void tickDeadlineScheduler();
    }, 60 * 60 * 1000);

    setInterval(() => {
      void tickExpiryScheduler();
    }, 24 * 60 * 60 * 1000);

    setInterval(() => {
      void tickHealthScheduler();
    }, 5 * 60 * 1000);

    setInterval(() => {
      void tickSourceSuggestionScheduler();
    }, 15 * 60 * 1000);

    logger.info("schedulers_started");
  }

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "worker_shutdown_started");
    await Promise.all(workers.map((w) => w.close()));
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, "worker_bootstrap_failed");
  process.exit(1);
});