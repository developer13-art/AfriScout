import { http } from "./http";
import type { OpportunityChange } from "../types/opportunity";

export const changeService = {
  list: (page = 1, pageSize = 50) =>
    http<OpportunityChange[]>("/changes", { query: { page, pageSize } }),
  markNotified: (id: string) =>
    http<OpportunityChange>(`/changes/${id}/notified`, { method: "POST" }),
};