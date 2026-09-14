import type { AiRequestInput, AiResponse } from "../../types/ai";
import { aiConfig } from "../../config/ai";
import { logger } from "../../config/logger";
import { configuredChain } from "./provider.registry";
import { InternalError } from "../../utils/errors";

export interface FallbackResult extends AiResponse {
  attemptedProviders: string[];
}

export async function runWithFallback(input: AiRequestInput): Promise<FallbackResult> {
  const chain = configuredChain();
  if (chain.length === 0) {
    throw new InternalError("No AI providers are configured");
  }

  const attempted: string[] = [];
  let lastError: unknown;

  for (const provider of chain) {
    attempted.push(provider.name);
    try {
      const response = await provider.complete(input);
      return {
        ...response,
        fallbackUsed: attempted.length > 1,
        attemptedProviders: attempted,
      } as FallbackResult;
    } catch (error) {
      lastError = error;
      logger.warn(
        { provider: provider.name, taskType: input.taskType, err: error },
        "ai_provider_failed",
      );
    }
  }

  logger.error({ attempted, taskType: input.taskType }, "ai_all_providers_failed");
  throw lastError ?? new InternalError("All AI providers failed");
}