import { runAi } from "./ai.service";
import { SEARCH_INTENT_PROMPT, SEARCH_INTENT_PROMPT_VERSION } from "./prompts/searchIntent.prompt";
import type { AskAfriScoutIntentPayload } from "../../types/ai";

export interface SearchIntentResult extends AskAfriScoutIntentPayload {
  provider: string;
  model: string;
}

export async function parseSearchIntent(query: string): Promise<SearchIntentResult> {
  const result = await runAi({
    taskType: "SEARCH_INTENT",
    promptVersion: SEARCH_INTENT_PROMPT_VERSION,
    systemPrompt: "You convert natural language queries into structured opportunity filters.",
    userPrompt: SEARCH_INTENT_PROMPT({ query }),
    responseFormat: "json",
  });

  const parsed = (result.output ?? {}) as Partial<AskAfriScoutIntentPayload>;
  return {
    ...parsed,
    provider: result.provider,
    model: result.model,
  };
}