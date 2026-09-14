import { runAi } from "./ai.service";
import { SUMMARY_PROMPT, SUMMARY_PROMPT_VERSION } from "./prompts/summary.prompt";
import type { AiSummaryPayload } from "../../types/ai";

export interface SummaryResult extends AiSummaryPayload {
  provider: string;
  model: string;
  generatedAt: string;
}

export async function summarizeOpportunity(input: {
  title: string;
  description: string | null;
  eligibility: string | null;
  requirements: string | null;
  opportunityId?: string | null;
}): Promise<SummaryResult> {
  const result = await runAi({
    taskType: "SUMMARY",
    promptVersion: SUMMARY_PROMPT_VERSION,
    systemPrompt: "You summarise opportunities for African users.",
    userPrompt: SUMMARY_PROMPT({
      title: input.title,
      description: input.description ?? "",
      eligibility: input.eligibility ?? "",
      requirements: input.requirements ?? "",
    }),
    responseFormat: "json",
    opportunityId: input.opportunityId ?? null,
  });

  const parsed = (result.output ?? {}) as Partial<AiSummaryPayload>;
  return {
    summary: parsed.summary ?? "",
    eligibility: parsed.eligibility ?? "",
    requirements: parsed.requirements ?? [],
    documents: parsed.documents ?? [],
    risks: parsed.risks ?? [],
    provider: result.provider,
    model: result.model,
    generatedAt: new Date().toISOString(),
  };
}