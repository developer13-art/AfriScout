import type { AiProvider } from "../provider.interface";
import type { AiRequestInput, AiResponse } from "../../../types/ai";

function deterministicClassification(input: AiRequestInput) {
  const text = input.userPrompt.toLowerCase();
  const category =
    text.includes("grant") ? "GRANTS"
      : text.includes("scholarship") ? "SCHOLARSHIPS"
        : text.includes("tender") ? "PROCUREMENT"
          : text.includes("job") ? "EMPLOYMENT"
            : "OTHER";
  return {
    category,
    opportunityType: category,
    confidence: 0.55,
    rationale: "Deterministic mock classification (offline mode).",
  };
}

function deterministicSummary(input: AiRequestInput) {
  return {
    summary: "Mock summary generated because no AI provider is configured.",
    eligibility: "Eligibility requires human review.",
    requirements: ["Review the official source"],
    documents: ["Application form"],
    risks: ["AI output is mocked."],
    note: input.userPrompt.slice(0, 120),
  };
}

function deterministicAnalyst() {
  return {
    recommendation: "Insufficient data for a strong recommendation (mock mode).",
    strengths: [],
    concerns: ["Mock output. Configure a real provider."],
    missingRequirements: [],
    nextSteps: ["Configure an AI provider", "Review the opportunity manually"],
  };
}

function deterministicSearchIntent(input: AiRequestInput) {
  // The search-intent prompt embeds the user's raw query on a line that
  // starts with "Query:". We extract just that line so the downstream
  // /search call receives a short, valid query instead of the full prompt.
  const raw = input.userPrompt ?? "";
  const match = raw.match(/Query:\s*(.+)/i);
  const q = (match?.[1] ?? raw).trim().slice(0, 200);
  return { q };
}

export const mockProvider: AiProvider = {
  name: "mock",

  isConfigured(): boolean {
    return true;
  },

  async complete(input: AiRequestInput): Promise<AiResponse> {
    const started = Date.now();
    let output: unknown;
    switch (input.taskType) {
      case "CLASSIFICATION":
        output = deterministicClassification(input);
        break;
      case "SUMMARY":
        output = deterministicSummary(input);
        break;
      case "ANALYST":
      case "RECOMMENDATIONS":
        output = deterministicAnalyst();
        break;
      case "SEARCH_INTENT":
        output = deterministicSearchIntent(input);
        break;
      default:
        output = { note: "Mock provider output", taskType: input.taskType };
    }

    return {
      provider: "mock",
      model: "mock",
      output,
      outputText: JSON.stringify(output),
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      latencyMs: Date.now() - started,
      fallbackUsed: false,
    };
  },
};