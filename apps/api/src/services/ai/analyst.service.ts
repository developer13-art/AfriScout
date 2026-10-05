import { runAi } from "./ai.service";
import { ANALYST_PROMPT, ANALYST_PROMPT_VERSION } from "./prompts/analyst.prompt";
import type { AiAnalystPayload } from "../../types/ai";
import type { DnaProfile } from "@prisma/client";

export interface AnalystResult extends AiAnalystPayload {
  provider: string;
  model: string;
  analyzedAt: string;
}

export async function analyseOpportunityForUser(input: {
  opportunityId: string;
  opportunity: {
    title: string;
    description: string | null;
    eligibility: string | null;
    requirements: string | null;
    deadline: string | null;
    valueMin: number | null;
    valueMax: number | null;
    currency: string | null;
    countryCode: string | null;
    organizationName: string | null;
  };
  dna: DnaProfile | null;
}): Promise<AnalystResult> {
  const dnaSummary = input.dna
    ? `Industries: ${input.dna.industries.join(", ")}. Capabilities: ${input.dna.capabilities.join(", ")}. Countries: ${input.dna.preferredCountries.join(", ")}.`
    : "No DNA profile available.";

  const result = await runAi({
    taskType: "ANALYST",
    promptVersion: ANALYST_PROMPT_VERSION,
    systemPrompt: "You are the AfriScout opportunity analyst. Provide decision support only.",
    userPrompt: ANALYST_PROMPT({
      dnaSummary,
      opportunity: input.opportunity,
    }),
    responseFormat: "json",
    opportunityId: input.opportunityId,
  });

  const parsed = (result.output ?? {}) as Partial<AiAnalystPayload>;
  return {
    recommendation: parsed.recommendation ?? "",
    strengths: parsed.strengths ?? [],
    concerns: parsed.concerns ?? [],
    missingRequirements: parsed.missingRequirements ?? [],
    nextSteps: parsed.nextSteps ?? [],
    provider: result.provider,
    model: result.model,
    analyzedAt: new Date().toISOString(),
  };
}