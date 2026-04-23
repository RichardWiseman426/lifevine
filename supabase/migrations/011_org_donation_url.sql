-- Migration 011: Contributor donation link
-- Contributors paste their own Stripe / PayPal / giving page URL here.
-- LifeVine never processes or holds these funds — the link opens externally.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS donation_url text;

COMMENT ON COLUMN public.organizations.donation_url IS
  'External donation / giving link (e.g. Stripe Payment Link, PayPal.me, church giving page). '
  'LifeVine opens this URL in the user''s browser — no funds pass through LifeVine.';
