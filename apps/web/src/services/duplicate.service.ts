import { http } from "./http";
import type { Opportunity } from "../types/opportunity";

export interface DuplicateCandidateResponse {
  id: string;
  canonical: Opportunity;
  candidate: Opportunity;
  similarity: number;
  status: "PENDING" | "MERGED" | "SEPARATE" | "IGNORED";
}

export const duplicateService = {
  list: () => http<DuplicateCandidateResponse[]>("/duplicates"),
  merge: (id: string) =>
    http<DuplicateCandidateResponse>(`/duplicates/${id}/merge`, { method: "POST" }),
  separate: (id: string) =>
    http<DuplicateCandidateResponse>(`/duplicates/${id}/separate`, { method: "POST" }),
  ignore: (id: string) =>
    http<DuplicateCandidateResponse>(`/duplicates/${id}/ignore`, { method: "POST" }),
};