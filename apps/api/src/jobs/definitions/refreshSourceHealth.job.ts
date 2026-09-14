import { maintenanceQueue } from "../queues/maintenance.queue";

export const REFRESH_SOURCE_HEALTH_JOB = "refresh-source-health";

export interface RefreshSourceHealthPayload {
  sourceId?: string;
}

export async function enqueueRefreshSourceHealth(payload: RefreshSourceHealthPayload = {}) {
  return maintenanceQueue.add(REFRESH_SOURCE_HEALTH_JOB, payload);
}