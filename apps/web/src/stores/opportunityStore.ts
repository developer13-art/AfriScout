import { create } from "zustand";
import type { Opportunity } from "../types/opportunity";

interface OpportunityState {
  cache: Record<string, Opportunity>;
  current: Opportunity | null;
  setCurrent: (opportunity: Opportunity | null) => void;
  upsert: (opportunity: Opportunity) => void;
  upsertMany: (opportunities: Opportunity[]) => void;
  clear: () => void;
}

export const useOpportunityStore = create<OpportunityState>((set) => ({
  cache: {},
  current: null,
  setCurrent: (opportunity) => set({ current: opportunity }),
  upsert: (opportunity) =>
    set((state) => ({ cache: { ...state.cache, [opportunity.id]: opportunity } })),
  upsertMany: (opportunities) =>
    set((state) => {
      const next = { ...state.cache };
      for (const opportunity of opportunities) next[opportunity.id] = opportunity;
      return { cache: next };
    }),
  clear: () => set({ cache: {}, current: null }),
}));