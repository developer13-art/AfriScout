import { create } from "zustand";

interface UiState {
  mobileNavOpen: boolean;
  commandPaletteOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  toggleCommandPalette: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  commandPaletteOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  toggleMobileNav: () =>
    set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
}));