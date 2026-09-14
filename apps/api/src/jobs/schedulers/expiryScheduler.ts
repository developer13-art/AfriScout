import { logger } from "../../config/logger";
import { expireOpportunities } from "../../services/opportunities/expiry.service";

export async function tickExpiryScheduler(): Promise<number> {
  const count = await expireOpportunities();
  logger.info({ count }, "expiry_scheduler_tick");
  return count;
}