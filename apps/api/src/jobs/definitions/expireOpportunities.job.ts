import { maintenanceQueue } from "../queues/maintenance.queue";

export const EXPIRE_OPPORTUNITIES_JOB = "expire-opportunities";

export async function enqueueExpireOpportunities() {
  return maintenanceQueue.add(EXPIRE_OPPORTUNITIES_JOB, {});
}