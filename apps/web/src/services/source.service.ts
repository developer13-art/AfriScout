import { http } from "./http";
import type {
  Source,
  SourceAdapter,
  SourceFilters,
  SourceSuggestion,
} from "../types/source";

export const sourceService = {
  list: (filters?: SourceFilters, page = 1, pageSize = 20) =>
    http<Source[]>("/sources", { query: { ...filters, page, pageSize } }),

  get: (id: string) => http<Source>(`/sources/${id}`),

  create: (source: Partial<Source>) =>
    http<Source>("/sources", { method: "POST", body: JSON.stringify(source) }),

  update: (id: string, patch: Partial<Source>) =>
    http<Source>(`/sources/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  activate: (id: string) => http<Source>(`/sources/${id}/activate`, { method: "POST" }),
  deactivate: (id: string) =>
    http<Source>(`/sources/${id}/deactivate`, { method: "POST" }),
  test: (id: string) =>
    http<{ success: boolean; itemsFound: number }>(`/sources/${id}/test`, {
      method: "POST",
    }),

  adapters: () => http<SourceAdapter[]>("/sources/adapters"),

  suggestions: () => http<SourceSuggestion[]>("/sources/suggestions"),
  createSuggestion: (suggestion: Partial<SourceSuggestion>) =>
    http<SourceSuggestion>("/sources/suggestions", {
      method: "POST",
      body: JSON.stringify(suggestion),
    }),
  reviewSuggestion: (id: string, status: string, reviewNotes?: string) =>
    http<SourceSuggestion>(`/sources/suggestions/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ status, reviewNotes }),
    }),
};