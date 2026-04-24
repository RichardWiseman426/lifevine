-- ─────────────────────────────────────────────────────────────────────────────
-- 014: Add expo_push_token to profiles
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expo_push_token text;

-- Index for the push-message Edge Function to look up tokens by user_id quickly
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
  ON public.profiles(expo_push_token)
  WHERE expo_push_token IS NOT NULL;
