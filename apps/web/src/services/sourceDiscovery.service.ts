import { http } from "./http";
import type {
  CandidateReviewInput,
  CandidateReviewResult,
  DiscoveryInput,
  DiscoveryRun,
  DiscoveryRunWithCandidates,
  Overview,
  SourceCandidate,
} from "../types/sourceDiscovery";

export const sourceDiscoveryService = {
  overview: () => http<Overview>("/source-discovery/overview"),

  runs: () => http<DiscoveryRun[]>("/source-discovery/runs"),

  createRun: (input: DiscoveryInput) =>
    http<DiscoveryRun>("/source-discovery/runs", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getRun: (id: string) =>
    http<DiscoveryRunWithCandidates>(`/source-discovery/runs/${encodeURIComponent(id)}`),

  candidates: () => http<SourceCandidate[]>("/source-discovery/candidates"),

  reviewCandidate: (id: string, input: CandidateReviewInput) =>
    http<CandidateReviewResult>(
      `/source-discovery/candidates/${encodeURIComponent(id)}/review`,
      { method: "POST", body: JSON.stringify(input) },
    ),
};
