import { runAi } from "../ai/ai.service";
import { DOCUMENT_PROMPT, DOCUMENT_PROMPT_VERSION } from "../ai/prompts/document.prompt";

export interface DocumentExtractionResult {
  eligibility: string;
  requirements: string[];
  documents: string[];
  value: string;
  deadline: string;
  notes: string;
  provider: string;
  model: string;
}

export async function extractDocumentFields(input: {
  fileName: string;
  text: string;
}): Promise<DocumentExtractionResult> {
  const result = await runAi({
    taskType: "DOCUMENT",
    promptVersion: DOCUMENT_PROMPT_VERSION,
    systemPrompt: "You extract structured fields from opportunity documents.",
    userPrompt: DOCUMENT_PROMPT({ fileName: input.fileName, text: input.text }),
    responseFormat: "json",
  });

  const parsed = (result.output ?? {}) as Partial<DocumentExtractionResult>;
  return {
    eligibility: parsed.eligibility ?? "",
    requirements: parsed.requirements ?? [],
    documents: parsed.documents ?? [],
    value: parsed.value ?? "",
    deadline: parsed.deadline ?? "",
    notes: parsed.notes ?? "",
    provider: result.provider,
    model: result.model,
  };
}