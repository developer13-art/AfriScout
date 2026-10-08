import { pipelineQueue } from "../queues/pipeline.queue";

export interface VerifySourceRunPayload {
  sourceRunId: string;
}

export const VERIFY_SOURCE_RUN_JOB = "verify-source-run";

export async function enqueueVerifySourceRun(payload: VerifySourceRunPayload) {
  return pipelineQueue.add(VERIFY_SOURCE_RUN_JOB, payload, {
    jobId: `verify-source-run-${payload.sourceRunId}`,
  });
}
