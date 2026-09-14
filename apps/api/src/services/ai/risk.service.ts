import { runAi } from "./ai.service";
import { RISK_PROMPT, RISK_PROMPT_VERSION } from "./prompts/risk.prompt";

export interface RiskResult {
  risks: string[];
  concerns: string[];
  provider: string;
  model: string;
}

export async function analyseRisk(input: {
  title: string;
  description: string | null;
  deadline: string | null;
  requirements: string | null;
  opportunityId?: string | null;
}): Promise<RiskResult> {
  const result = await runAi({
    taskType: "RISK",
    promptVersion: RISK_PROMPT_VERSION,
    systemPrompt: "You highlight risks and concerns for opportunities.",
    userPrompt: RISK_PROMPT(input),
    responseFormat: "json",
    opportunityId: input.opportunityId ?? null,
  });

  const parsed = (result.output ?? {}) as Partial<RiskResult>;
  return {
    risks: parsed.risks ?? [],
    concerns: parsed.concerns ?? [],
    provider: result.provider,
    model: result.model,
  };
}