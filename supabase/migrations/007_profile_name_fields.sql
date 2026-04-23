-- ============================================================
-- Migration 007: Add first_name / last_name to profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text
    CHECK (first_name IS NULL OR char_length(first_name) BETWEEN 1 AND 60),
  ADD COLUMN IF NOT EXISTS last_name  text
    CHECK (last_name  IS NULL OR char_length(last_name)  BETWEEN 1 AND 60);
