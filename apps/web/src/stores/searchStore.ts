import { create } from "zustand";
import type { OpportunityFilters } from "../types/opportunity";

interface SearchState {
  query: string;
  filters: OpportunityFilters;
  sort: string;
  layout: "grid" | "list";
  setQuery: (query: string) => void;
  setFilters: (filters: OpportunityFilters) => void;
  patchFilters: (patch: Partial<OpportunityFilters>) => void;
  setSort: (sort: string) => void;
  setLayout: (layout: "grid" | "list") => void;
  reset: () => void;
}

const initialFilters: OpportunityFilters = {};

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  filters: initialFilters,
  sort: "relevance",
  layout: "grid",
  setQuery: (query) => set({ query }),
  setFilters: (filters) => set({ filters }),
  patchFilters: (patch) =>
    set((state) => ({ filters: { ...state.filters, ...patch } })),
  setSort: (sort) => set({ sort }),
  setLayout: (layout) => set({ layout }),
  reset: () =>
    set({ query: "", filters: initialFilters, sort: "relevance", layout: "grid" }),
}));