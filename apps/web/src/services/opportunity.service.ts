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

export interface OrganizationOpportunityInput {
  title: string;
  category: string;
  opportunityType: string;
  description: string;
  countryCode?: string;
  isRemote: boolean;
  deadline?: string;
  applicationUrl?: string;
}

export const opportunityService = {
  list: (filters?: OpportunityFilters, page = 1, pageSize = 20) =>
    http<OpportunitySearchResult>("/opportunities", {
      query: { ...filters, page, pageSize },
    }),

  get: (slug: string) => http<Opportunity>(`/opportunities/${slug}`),

  getById: (id: string) => http<Opportunity>(`/opportunities/by-id/${id}`),

  createForOrganization: (organizationId: string, input: OrganizationOpportunityInput) =>
    http<Opportunity>(`/organizations/${organizationId}/opportunities`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  requirements: (id: string) =>
    http<OpportunityRequirement[]>(`/opportunities/${id}/requirements`),

  documents: (id: string) =>
    http<OpportunityDocument[]>(`/opportunities/${id}/documents`),

  sources: (id: string) =>
    http<OpportunitySourceLink[]>(`/opportunities/${id}/sources`),

  changes: (id: string) =>
    http<OpportunityChange[]>(`/opportunities/${id}/changes`),

  provenanceProofTransaction: (id: string, account: string) =>
    http<{ transaction: string; contentHash: string; sourceHash: string }>(
      `/opportunities/${id}/provenance-proof/transaction`,
      { method: "POST", body: JSON.stringify({ account }) },
    ),

  confirmProvenanceProof: (id: string, transactionSignature: string) =>
    http<NonNullable<Opportunity["provenanceProofs"]>[number]>(
      `/opportunities/${id}/provenance-proof/confirm`,
      { method: "POST", body: JSON.stringify({ transactionSignature }) },
    ),
};