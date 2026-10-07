import { runAi } from "./ai.service";
import { ELIGIBILITY_PROMPT, ELIGIBILITY_PROMPT_VERSION } from "./prompts/eligibility.prompt";

export interface EligibilityResult {
  summary: string;
  requirements: string[];
  redFlags: string[];
  provider: string;
  model: string;
}

export async function analyseEligibility(input: {
  title: string;
  eligibility: string | null;
  requirements: string | null;
  opportunityId?: string | null;
}): Promise<EligibilityResult> {
  const result = await runAi({
    taskType: "ELIGIBILITY",
    promptVersion: ELIGIBILITY_PROMPT_VERSION,
    systemPrompt: "You analyse eligibility for African opportunities.",
    userPrompt: ELIGIBILITY_PROMPT({
      title: input.title,
      eligibility: input.eligibility ?? "",
      requirements: input.requirements ?? "",
    }),
    responseFormat: "json",
    opportunityId: input.opportunityId ?? null,
  });

  const parsed = (result.output ?? {}) as Partial<EligibilityResult>;
  return {
    summary: parsed.summary ?? "",
    requirements: parsed.requirements ?? [],
    redFlags: parsed.redFlags ?? [],
    provider: result.provider,
    model: result.model,
  };
}