import { runAi } from "./ai.service";
import { RECOMMENDATIONS_PROMPT, RECOMMENDATIONS_PROMPT_VERSION } from "./prompts/recommendations.prompt";

export interface RecommendationResult {
  nextSteps: string[];
  reasoning: string;
  provider: string;
  model: string;
}

export async function recommendActions(input: {
  title: string;
  dnaSummary: string;
  deadline: string | null;
  requirements: string[];
  opportunityId?: string | null;
}): Promise<RecommendationResult> {
  const result = await runAi({
    taskType: "RECOMMENDATIONS",
    promptVersion: RECOMMENDATIONS_PROMPT_VERSION,
    systemPrompt: "You recommend next steps for opportunity pursuit.",
    userPrompt: RECOMMENDATIONS_PROMPT(input),
    responseFormat: "json",
    opportunityId: input.opportunityId ?? null,
  });

  const parsed = (result.output ?? {}) as Partial<RecommendationResult>;
  return {
    nextSteps: parsed.nextSteps ?? [],
    reasoning: parsed.reasoning ?? "",
    provider: result.provider,
    model: result.model,
  };
}