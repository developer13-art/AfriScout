import type { AiRequestInput } from "../../types/ai";
import { runWithFallback } from "./fallback.service";
import { aiConfig } from "../../config/ai";
import { prisma } from "../../config/database";
import { logger } from "../../config/logger";

export interface RunAiInput extends AiRequestInput {
  opportunityId?: string | null;
  opportunityVersion?: number | null;
}

export async function runAi(input: RunAiInput) {
  if (!aiConfig.enabled) {
    throw new Error("AI is disabled by configuration");
  }

  const started = Date.now();
  const result = await runWithFallback(input);
  const latencyMs = Date.now() - started;

  if (input.opportunityId) {
    await prisma.aiAnalysis.create({
      data: {
        opportunityId: input.opportunityId,
        opportunityVersion: input.opportunityVersion ?? null,
        taskType: input.taskType,
        provider: result.provider.toUpperCase() as never,
        model: result.model,
        promptVersion: input.promptVersion,
        inputHash: JSON.stringify(input.userPrompt).slice(0, 120),
        output: result.output as never,
        outputText: result.outputText,
        tokensInput: result.tokensInput ?? null,
        tokensOutput: result.tokensOutput ?? null,
        costUsd: result.costUsd ?? null,
        latencyMs,
        status: result.fallbackUsed ? "FALLBACK_USED" : "SUCCEEDED",
      },
    });
  }

  logger.info(
    {
      taskType: input.taskType,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed,
      latencyMs,
    },
    "ai_run_completed",
  );

  return result;
}

export function isAiEnabled(): boolean {
  return aiConfig.enabled;
}

export function providerChain(): string[] {
  return aiConfig.chain.slice();
}