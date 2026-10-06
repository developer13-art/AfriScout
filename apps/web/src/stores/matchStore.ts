import { create } from "zustand";
import type { Match } from "../types/match";

interface MatchState {
  byOpportunity: Record<string, Match>;
  lastRunAt: string | null;
  setMatch: (match: Match) => void;
  setMany: (matches: Match[]) => void;
  setLastRunAt: (timestamp: string | null) => void;
  clear: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  byOpportunity: {},
  lastRunAt: null,
  setMatch: (match) =>
    set((state) => ({
      byOpportunity: { ...state.byOpportunity, [match.opportunityId]: match },
    })),
  setMany: (matches) =>
    set((state) => {
      const next = { ...state.byOpportunity };
      for (const match of matches) next[match.opportunityId] = match;
      return { byOpportunity: next };
    }),
  setLastRunAt: (lastRunAt) => set({ lastRunAt }),
  clear: () => set({ byOpportunity: {}, lastRunAt: null }),
}));