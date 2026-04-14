import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const SKIP_INTENT_KEY = 'lifevine_skip_intent_gate';

interface SettingsState {
  skipIntentGate: boolean;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  setSkipIntentGate: (value: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  skipIntentGate: false,
  loaded: false,

  loadSettings: async () => {
    try {
      const val = await SecureStore.getItemAsync(SKIP_INTENT_KEY);
      set({ skipIntentGate: val === 'true', loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  setSkipIntentGate: async (value: boolean) => {
    try {
      await SecureStore.setItemAsync(SKIP_INTENT_KEY, value ? 'true' : 'false');
    } catch {}
    set({ skipIntentGate: value });
  },
}));
