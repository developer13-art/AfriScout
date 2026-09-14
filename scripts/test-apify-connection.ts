#!/usr/bin/env tsx
import { apifyConfig } from "../apps/api/src/config/apify";
import { apifyRequest } from "../apps/api/src/services/apify/apify.service";
import { logger } from "../apps/api/src/config/logger";

async function main(): Promise<void> {
  if (!apifyConfig.isConfigured) {
    logger.warn("APIFY_TOKEN is not set. Set it in .env to test the connection.");
    process.exit(1);
  }

  try {
    const user = await apifyRequest<{ data: { username: string; plan: string } }>("/users/me");
    logger.info(
      { username: user.data.username, plan: user.data.plan },
      "apify_connection_ok",
    );
  } catch (error) {
    logger.error({ err: error }, "apify_connection_failed");
    process.exit(1);
  }
}

void main();