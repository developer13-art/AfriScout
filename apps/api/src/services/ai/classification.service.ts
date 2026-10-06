import { runAi } from "./ai.service";
import { CLASSIFICATION_PROMPT, CLASSIFICATION_PROMPT_VERSION } from "./prompts/classification.prompt";

export interface ClassificationResult {
  category: string;
  opportunityType: string;
  confidence: number;
  rationale: string;
  provider: string;
  model: string;
}

export async function classifyOpportunity(input: {
  title: string;
  description: string | null;
  organizationName: string | null;
  opportunityId?: string | null;
}): Promise<ClassificationResult> {
  const prompt = CLASSIFICATION_PROMPT({
    title: input.title,
    description: input.description ?? "",
    organizationName: input.organizationName ?? "",
  });

  const result = await runAi({
    taskType: "CLASSIFICATION",
    promptVersion: CLASSIFICATION_PROMPT_VERSION,
    systemPrompt: "You are an opportunity classification engine for Africa.",
    userPrompt: prompt,
    responseFormat: "json",
    opportunityId: input.opportunityId ?? null,
  });

  const parsed = (result.output ?? {}) as Partial<ClassificationResult>;
  return {
    category: parsed.category ?? "OTHER",
    opportunityType: parsed.opportunityType ?? "OTHER",
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    rationale: parsed.rationale ?? "",
    provider: result.provider,
    model: result.model,
  };
}