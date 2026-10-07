import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../config/logger";

const TEMPLATES_KEY = "notifications.templates";

const templates = {
  NEW_MATCH: {
    title: "New high match opportunity",
    body: "A new opportunity matches your Business DNA.",
  },
  DEADLINE_SOON: {
    title: "Deadline approaching",
    body: "An opportunity you are tracking closes soon.",
  },
  DEADLINE_CHANGED: {
    title: "Deadline changed",
    body: "The deadline for a watched opportunity has changed.",
  },
  REQUIREMENT_CHANGED: {
    title: "Requirements updated",
    body: "An opportunity you are watching has updated requirements.",
  },
  OPPORTUNITY_UPDATED: {
    title: "Opportunity updated",
    body: "A watched opportunity has been updated at the source.",
  },
  OPPORTUNITY_EXPIRED: {
    title: "Opportunity expired",
    body: "A watched opportunity has passed its deadline.",
  },
  SOURCE_FAILED: {
    title: "Source extraction failed",
    body: "A source is failing extraction. Admin review required.",
  },
};

export async function seedNotificationTemplates(prisma: PrismaClient): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: TEMPLATES_KEY },
    update: { value: templates },
    create: {
      key: TEMPLATES_KEY,
      value: templates,
      description: "Default notification templates by type",
    },
  });
  logger.info("notification_templates_seeded");
}