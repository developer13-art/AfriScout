import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { verifySourceRunBatch } from "../../services/opportunities/verificationBatch.service";
import { VerifySourceRunPayload } from "../definitions/verifySourceRun.job";

export async function processVerificationBatchJob(
  job: { name: string; payload: unknown },
): Promise<void> {
  if (job.name !== "verify-source-run") {
    logger.warn({ jobName: job.name }, "verification_batch_unknown_job");
    return;
  }

  const { sourceRunId } = job.payload as VerifySourceRunPayload;
  await verifySourceRunBatch(sourceRunId);
}
