import { create } from "zustand";
import type { PipelineItem, PipelineStage } from "../types/pipeline";

interface PipelineState {
  items: Record<string, PipelineItem>;
  activePipelineId: string | null;
  setItems: (items: PipelineItem[]) => void;
  upsert: (item: PipelineItem) => void;
  moveStage: (itemId: string, stage: PipelineStage) => void;
  setActivePipeline: (id: string | null) => void;
  reset: () => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  items: {},
  activePipelineId: null,
  setItems: (items) =>
    set(() => {
      const next: Record<string, PipelineItem> = {};
      for (const item of items) next[item.id] = item;
      return { items: next };
    }),
  upsert: (item) =>
    set((state) => ({ items: { ...state.items, [item.id]: item } })),
  moveStage: (itemId, stage) =>
    set((state) => {
      const item = state.items[itemId];
      if (!item) return {};
      return { items: { ...state.items, [itemId]: { ...item, stage } } };
    }),
  setActivePipeline: (activePipelineId) => set({ activePipelineId }),
  reset: () => set({ items: {}, activePipelineId: null }),
}));