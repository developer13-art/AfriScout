#!/usr/bin/env tsx
import { aiConfig } from "../apps/api/src/config/ai";
import { runWithFallback } from "../apps/api/src/services/ai/fallback.service";
import { logger } from "../apps/api/src/config/logger";

async function main(): Promise<void> {
  logger.info(
    {
      enabled: aiConfig.enabled,
      chain: aiConfig.chain,
    },
    "ai_config",
  );

  if (!aiConfig.enabled) {
    logger.warn("AI is disabled by configuration.");
    return;
  }

  try {
    const response = await runWithFallback({
      taskType: "CLASSIFICATION",
      promptVersion: "cli-test",
      userPrompt: "Classify the following opportunity: sample tender for road construction.",
      responseFormat: "json",
    });

    logger.info(
      {
        provider: response.provider,
        model: response.model,
        fallbackUsed: response.fallbackUsed,
        latencyMs: response.latencyMs,
      },
      "ai_response_ok",
    );
    logger.info({ output: response.output }, "ai_response_output");
  } catch (error) {
    logger.error({ err: error }, "ai_providers_failed");
    process.exit(1);
  }
}

void main();