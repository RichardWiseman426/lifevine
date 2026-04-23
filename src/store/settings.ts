import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// ─── ARCHIVED (intent-gate removed 2026-04) ──────────────────────────────────
// SKIP_INTENT_KEY = 'lifevine_skip_intent_gate'
// skipIntentGate: bool + setSkipIntentGate were removed.
// intent-gate.tsx and emergency.tsx remain on disk unrouted — restore by
// adding Stack.Screen entries back in app/_layout.tsx and useIntentStore refs.
// ─────────────────────────────────────────────────────────────────────────────

const HAS_SEEN_WELCOME_KEY     = 'lifevine_has_seen_welcome';
const HOME_CAROUSEL_CAT_KEY    = 'lifevine_home_carousel_cat';
const HOME_CAROUSEL_PROMPTED   = 'lifevine_home_carousel_prompted';
const SHOW_AFFIRMATION_KEY     = 'lifevine_show_affirmation';
const AFFIRMATION_POSITION_KEY = 'lifevine_affirmation_pos';

export type AffirmationPosition = 'top' | 'bottom';

interface SettingsState {
  /** True once the user has tapped "Get Started" on the welcome screen. */
  hasSeenWelcome: boolean;
  /** The org category (or 'events' / 'opportunities') shown in the home carousel */
  homeCarouselCategory: string | null;
  /** True once the user has been shown the first-load category picker */
  homeCarouselPrompted: boolean;
  showDailyAffirmation: boolean;
  affirmationPosition: AffirmationPosition;
  loaded: boolean;

  loadSettings: () => Promise<void>;
  setHasSeenWelcome: () => Promise<void>;
  setHomeCarouselCategory: (cat: string) => Promise<void>;
  setHomeCarouselPrompted: () => Promise<void>;
  setShowDailyAffirmation: (value: boolean) => Promise<void>;
  setAffirmationPosition: (pos: AffirmationPosition) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hasSeenWelcome: false,
  homeCarouselCategory: null,
  homeCarouselPrompted: false,
  showDailyAffirmation: true,
  affirmationPosition: 'bottom',
  loaded: false,

  loadSettings: async () => {
    try {
      const [seen, cat, prompted, showAff, affPos] = await Promise.all([
        SecureStore.getItemAsync(HAS_SEEN_WELCOME_KEY),
        SecureStore.getItemAsync(HOME_CAROUSEL_CAT_KEY),
        SecureStore.getItemAsync(HOME_CAROUSEL_PROMPTED),
        SecureStore.getItemAsync(SHOW_AFFIRMATION_KEY),
        SecureStore.getItemAsync(AFFIRMATION_POSITION_KEY),
      ]);
      set({
        hasSeenWelcome: seen === 'true',
        homeCarouselCategory: cat ?? null,
        homeCarouselPrompted: prompted === 'true',
        showDailyAffirmation: showAff !== 'false', // default true
        affirmationPosition: (affPos as AffirmationPosition) ?? 'bottom',
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  setHasSeenWelcome: async () => {
    try { await SecureStore.setItemAsync(HAS_SEEN_WELCOME_KEY, 'true'); } catch {}
    set({ hasSeenWelcome: true });
  },

  setHomeCarouselCategory: async (cat) => {
    try { await SecureStore.setItemAsync(HOME_CAROUSEL_CAT_KEY, cat); } catch {}
    set({ homeCarouselCategory: cat, homeCarouselPrompted: true });
  },

  setHomeCarouselPrompted: async () => {
    try { await SecureStore.setItemAsync(HOME_CAROUSEL_PROMPTED, 'true'); } catch {}
    set({ homeCarouselPrompted: true });
  },

  setShowDailyAffirmation: async (value) => {
    try { await SecureStore.setItemAsync(SHOW_AFFIRMATION_KEY, value ? 'true' : 'false'); } catch {}
    set({ showDailyAffirmation: value });
  },

  setAffirmationPosition: async (pos) => {
    try { await SecureStore.setItemAsync(AFFIRMATION_POSITION_KEY, pos); } catch {}
    set({ affirmationPosition: pos });
  },
}));
