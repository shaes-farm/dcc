import { create } from "zustand";

/**
 * Client/UI state (spec §9) — things the browser owns and the server never
 * needs to know about. Server state belongs in TanStack Query instead; see
 * app/providers.tsx.
 *
 * Deliberately minimal at the shell stage. Layout and panel state arrive with
 * the slot engine (#12), the polling toggle with #78.
 */
interface UiState {
  /** Whether the right-hand context drawer is open (§5.5). */
  contextPanelOpen: boolean;
  setContextPanelOpen: (open: boolean) => void;
  toggleContextPanel: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  contextPanelOpen: false,
  setContextPanelOpen: (open) => set({ contextPanelOpen: open }),
  toggleContextPanel: () =>
    set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),
}));
