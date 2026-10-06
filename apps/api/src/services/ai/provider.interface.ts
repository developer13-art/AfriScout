import type { AiRequestInput, AiResponse } from "../../types/ai";
import type { AiProviderName } from "../../config/ai";

export interface AiProvider {
  readonly name: AiProviderName;
  isConfigured(): boolean;
  complete(input: AiRequestInput): Promise<AiResponse>;
}