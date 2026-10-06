import { http } from "./http";
import type { AiAnalystResult, AiSummary, AskAfriScoutIntent } from "../types/ai";

export const aiService = {
  summary: (opportunityId: string) =>
    http<AiSummary>(`/ai/opportunities/${opportunityId}/summary`),

  analyst: (opportunityId: string) =>
    http<AiAnalystResult>(`/ai/opportunities/${opportunityId}/analyst`, {
      method: "POST",
    }),

  ask: (query: string) =>
    http<AskAfriScoutIntent>("/ai/ask", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),
};