import { create } from "zustand";
import type { DnaProfile, DnaDraft } from "../types/dna";

interface DnaState {
  active: DnaProfile | null;
  draft: Partial<DnaDraft>;
  dirty: boolean;
  setActive: (profile: DnaProfile | null) => void;
  setDraftField: <K extends keyof DnaDraft>(key: K, value: DnaDraft[K]) => void;
  replaceDraft: (draft: Partial<DnaDraft>) => void;
  markClean: () => void;
  reset: () => void;
}

export const useDnaStore = create<DnaState>((set) => ({
  active: null,
  draft: {},
  dirty: false,
  setActive: (active) => set({ active }),
  setDraftField: (key, value) =>
    set((state) => ({ draft: { ...state.draft, [key]: value }, dirty: true })),
  replaceDraft: (draft) => set({ draft, dirty: true }),
  markClean: () => set({ dirty: false }),
  reset: () => set({ active: null, draft: {}, dirty: false }),
}));