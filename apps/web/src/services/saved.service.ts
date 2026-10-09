import { http } from "./http";
import type { Opportunity } from "../types/opportunity";

export interface SavedEntry {
  id: string;
  opportunityId: string;
  opportunity: Opportunity;
  createdAt: string;
}

export const savedService = {
  list: () => http<SavedEntry[]>("/saved"),
  add: (opportunityId: string) =>
    http<SavedEntry>("/saved", {
      method: "POST",
      body: JSON.stringify({ opportunityId }),
    }),
  remove: (opportunityId: string) =>
    http<void>(`/saved/${opportunityId}`, { method: "DELETE" }),
};