import { logger } from "../../config/logger";
import { SEND_NOTIFICATION_JOB } from "../definitions/sendNotification.job";
import { dispatchNotification } from "../../services/notifications/dispatcher.service";

export async function processNotificationJob(job: { name: string; payload: unknown }): Promise<void> {
      if (job.name === SEND_NOTIFICATION_JOB) {
        await dispatchNotification(job.payload as never);
      } else {
        logger.warn({ jobName: job.name }, "notification_unknown_job");
      }
    }
}