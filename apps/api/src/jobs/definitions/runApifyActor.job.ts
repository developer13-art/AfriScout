import { apifyQueue } from "../queues/apify.queue";

export interface RunApifyActorPayload {
  sourceId: string;
  runId: string;
  actorId: string;
}

export const RUN_APIFY_ACTOR_JOB = "run-apify-actor";

export async function enqueueRunApifyActor(payload: RunApifyActorPayload) {
  return apifyQueue.add(RUN_APIFY_ACTOR_JOB, payload);
}