import { http } from "./http";
import type { Opportunity } from "../types/opportunity";

export interface WatchlistEntry {
  id: string;
  opportunityId: string;
  opportunity: Opportunity;
  createdAt: string;
  notifyDeadline: boolean;
  notifyChanges: boolean;
}

export const watchlistService = {
  list: () => http<WatchlistEntry[]>("/watchlist"),
  add: (opportunityId: string) =>
    http<WatchlistEntry>("/watchlist", {
      method: "POST",
      body: JSON.stringify({ opportunityId }),
    }),
  remove: (opportunityId: string) =>
    http<void>(`/watchlist/${opportunityId}`, { method: "DELETE" }),
  update: (
    opportunityId: string,
    patch: { notifyDeadline?: boolean; notifyChanges?: boolean },
  ) =>
    http<WatchlistEntry>(`/watchlist/${opportunityId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
};