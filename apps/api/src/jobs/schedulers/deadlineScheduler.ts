import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { enqueueSendNotification } from "../definitions/sendNotification.job";

export async function tickDeadlineScheduler(): Promise<number> {
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const watched = await prisma.watchlist.findMany({
    where: { notifyDeadline: true },
    include: { opportunity: true },
  });

  let notified = 0;
  for (const entry of watched) {
    if (!entry.opportunity.deadline) continue;
    const deadline = entry.opportunity.deadline.getTime();
    if (deadline > now.getTime() && deadline <= in3Days.getTime()) {
      const daysLeft = Math.max(0, Math.floor((deadline - now.getTime()) / (1000 * 60 * 60 * 24)));
      await enqueueSendNotification({
        userId: entry.userId,
        type: "DEADLINE_SOON",
        title: "Deadline approaching",
        body: `${entry.opportunity.title} closes in ${daysLeft} day(s).`,
        opportunityId: entry.opportunityId,
      });
      notified += 1;
    }
  }

  logger.info({ notified }, "deadline_scheduler_tick");
  return notified;
}