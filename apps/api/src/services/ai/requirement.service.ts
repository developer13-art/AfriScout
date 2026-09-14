import { runAi } from "./ai.service";
import { REQUIREMENT_PROMPT, REQUIREMENT_PROMPT_VERSION } from "./prompts/requirement.prompt";

export interface ExtractedRequirement {
  kind: string;
  label: string;
  description?: string;
  isMandatory: boolean;
}

export interface RequirementExtractionResult {
  requirements: ExtractedRequirement[];
  provider: string;
  model: string;
}

export async function extractRequirements(input: {
  title: string;
  description: string | null;
  eligibility: string | null;
  requirements: string | null;
  opportunityId?: string | null;
}): Promise<RequirementExtractionResult> {
  const result = await runAi({
    taskType: "REQUIREMENTS",
    promptVersion: REQUIREMENT_PROMPT_VERSION,
    systemPrompt: "You extract structured requirements from opportunities.",
    userPrompt: REQUIREMENT_PROMPT(input),
    responseFormat: "json",
    opportunityId: input.opportunityId ?? null,
  });

  const parsed = (result.output ?? {}) as { requirements?: ExtractedRequirement[] };
  return {
    requirements: parsed.requirements ?? [],
    provider: result.provider,
    model: result.model,
  };
}