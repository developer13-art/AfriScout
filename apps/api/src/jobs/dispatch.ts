import type { Prisma } from "@prisma/client";
import {
  DEDUPLICATE_JOB,
  DETECT_CHANGES_JOB,
  INGEST_APIFY_DATASET_JOB,
  PROCESS_OPPORTUNITY_JOB,
} from "./definitions";
import { EXPIRE_OPPORTUNITIES_JOB } from "./definitions/expireOpportunities.job";
import { MATCH_USERS_JOB, RECOMPUTE_MATCHES_JOB } from "./definitions/matchUsers.job";
import { RECOMPUTE_ALL_MATCHES_JOB } from "./definitions/recomputeMatches.job";
import { PROCESS_DOCUMENT_JOB } from "./definitions/processDocument.job";
import { REFRESH_SOURCE_HEALTH_JOB } from "./definitions/refreshSourceHealth.job";
import { RUN_APIFY_ACTOR_JOB } from "./definitions/runApifyActor.job";
import { SEND_NOTIFICATION_JOB } from "./definitions/sendNotification.job";
import { DELIVER_WEBHOOK_JOB } from "./definitions/deliverWebhook.job";
import { processApifyJob } from "./workers/apify.worker";
import { processDocumentJob } from "./workers/document.worker";
import { processMaintenanceJob } from "./workers/maintenance.worker";
import { processMatchingJob } from "./workers/matching.worker";
import { processNotificationJob } from "./workers/notification.worker";
import { processPipelineJob } from "./workers/pipeline.worker";
import { processWebhookJob } from "./workers/webhook.worker";

export interface QueuedJob {
  id: string;
  name: string;
  payload: Prisma.JsonValue;
}

export async function dispatchDatabaseJob(job: QueuedJob): Promise<void> {
  const input = { name: job.name, payload: job.payload };

  switch (job.name) {
    case PROCESS_OPPORTUNITY_JOB:
    case DEDUPLICATE_JOB:
    case DETECT_CHANGES_JOB:
    case INGEST_APIFY_DATASET_JOB:
      return processPipelineJob(input);
    case MATCH_USERS_JOB:
    case RECOMPUTE_MATCHES_JOB:
    case RECOMPUTE_ALL_MATCHES_JOB:
      return processMatchingJob(input);
    case SEND_NOTIFICATION_JOB:
      return processNotificationJob(input);
    case RUN_APIFY_ACTOR_JOB:
      return processApifyJob(input);
    case PROCESS_DOCUMENT_JOB:
      return processDocumentJob(input);
    case EXPIRE_OPPORTUNITIES_JOB:
    case REFRESH_SOURCE_HEALTH_JOB:
      return processMaintenanceJob(input);
    case DELIVER_WEBHOOK_JOB:
      return processWebhookJob(input);
    default:
      throw new Error(`No database job handler is registered for "${job.name}"`);
  }
}
