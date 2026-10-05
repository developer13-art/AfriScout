import { http } from "./http";
import type {
  Opportunity,
  OpportunityChange,
  OpportunityDocument,
  OpportunityFilters,
  OpportunityRequirement,
  OpportunitySearchResult,
  OpportunitySourceLink,
} from "../types/opportunity";

export const opportunityService = {
  list: (filters?: OpportunityFilters, page = 1, pageSize = 20) =>
    http<OpportunitySearchResult>("/opportunities", {
      query: { ...filters, page, pageSize },
    }),

  get: (slug: string) => http<Opportunity>(`/opportunities/${slug}`),

  getById: (id: string) => http<Opportunity>(`/opportunities/by-id/${id}`),

  requirements: (id: string) =>
    http<OpportunityRequirement[]>(`/opportunities/${id}/requirements`),

  documents: (id: string) =>
    http<OpportunityDocument[]>(`/opportunities/${id}/documents`),

  sources: (id: string) =>
    http<OpportunitySourceLink[]>(`/opportunities/${id}/sources`),

  changes: (id: string) =>
    http<OpportunityChange[]>(`/opportunities/${id}/changes`),
};