import { create } from 'zustand';

export type IntentMode = 'help_now' | 'support' | 'help_others' | 'browsing' | null;

interface IntentState {
  mode: IntentMode;
  needsGate: boolean;          // true = show gate on next navigation
  setMode: (mode: IntentMode) => void;
  setNeedsGate: (v: boolean) => void;
}

export const useIntentStore = create<IntentState>((set) => ({
  mode: null,
  needsGate: false,
  setMode: (mode) => set({ mode }),
  setNeedsGate: (needsGate) => set({ needsGate }),
}));
