import { create } from "zustand";
import type { SourceFilters } from "../types/source";
import type { ActorRunFilters } from "../types/actorRun";

interface FilterState {
  source: SourceFilters;
  actorRun: ActorRunFilters;
  setSource: (filters: SourceFilters) => void;
  patchSource: (patch: Partial<SourceFilters>) => void;
  setActorRun: (filters: ActorRunFilters) => void;
  patchActorRun: (patch: Partial<ActorRunFilters>) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  source: {},
  actorRun: {},
  setSource: (source) => set({ source }),
  patchSource: (patch) => set((state) => ({ source: { ...state.source, ...patch } })),
  setActorRun: (actorRun) => set({ actorRun }),
  patchActorRun: (patch) =>
    set((state) => ({ actorRun: { ...state.actorRun, ...patch } })),
  reset: () => set({ source: {}, actorRun: {} }),
}));    