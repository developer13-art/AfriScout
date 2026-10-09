import { logger } from "../../config/logger";
import { EXPIRE_OPPORTUNITIES_JOB } from "../definitions/expireOpportunities.job";
import { REFRESH_SOURCE_HEALTH_JOB } from "../definitions/refreshSourceHealth.job";
import { expireOpportunities } from "../../services/opportunities/expiry.service";
import { recomputeSourceHealth } from "../../services/sources/sourceHealth.service";
import { prisma } from "../../config/database";

export async function processMaintenanceJob(job: { name: string; payload: unknown }): Promise<void> {
      switch (job.name) {
        case EXPIRE_OPPORTUNITIES_JOB: {
          const count = await expireOpportunities();
          logger.info({ count }, "maintenance_expired");
          break;
        }
        case REFRESH_SOURCE_HEALTH_JOB: {
          const { sourceId } = job.payload as { sourceId?: string };
          if (sourceId) {
            await recomputeSourceHealth(sourceId);
          } else {
            const sources = await prisma.source.findMany({ select: { id: true } });
            for (const source of sources) await recomputeSourceHealth(source.id);
          }
          break;
        }
        default:
          logger.warn({ jobName: job.name }, "maintenance_unknown_job");
      }
    }