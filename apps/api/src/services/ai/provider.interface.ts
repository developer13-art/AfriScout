import type { AiRequestInput, AiResponse } from "../../types/ai";

export interface AiProvider {
  readonly name: "openai" | "anthropic" | "gemini" | "mock";
  isConfigured(): boolean;
  complete(input: AiRequestInput): Promise<AiResponse>;
}