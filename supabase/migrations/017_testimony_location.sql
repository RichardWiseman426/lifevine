-- ─────────────────────────────────────────────────────────────────────────────
-- 017: Add city + state to testimonies for location-based filtering
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.testimonies
  ADD COLUMN IF NOT EXISTS city  text,
  ADD COLUMN IF NOT EXISTS state text;

CREATE INDEX IF NOT EXISTS idx_testimonies_location
  ON public.testimonies(city, state)
  WHERE city IS NOT NULL AND deleted_at IS NULL;
