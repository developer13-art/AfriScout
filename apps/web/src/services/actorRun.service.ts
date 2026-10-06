import { http } from "./http";
import type { RawOpportunity, SourceRun } from "../types/actorRun";

export const actorRunService = {
  list: (filters?: Record<string, unknown>, page = 1, pageSize = 20) =>
    http<SourceRun[]>("/actor-runs", { query: { ...filters, page, pageSize } }),

  get: (id: string) => http<SourceRun>(`/actor-runs/${id}`),

  trigger: (sourceId: string) =>
    http<SourceRun>(`/actor-runs/trigger`, {
      method: "POST",
      body: JSON.stringify({ sourceId }),
    }),

  abort: (id: string) => http<SourceRun>(`/actor-runs/${id}/abort`, { method: "POST" }),

  rawItems: (id: string) => http<RawOpportunity[]>(`/actor-runs/${id}/raw`),
};