-- Add is_partner flag to organizations.
-- Partner tier: featured placement in ALL carousels app-wide (within state).
-- Enhanced tier: is_featured=true only → featured on home page carousel only.
-- Admin sets is_partner=true (and is_featured=true) when org upgrades to partner.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_partner boolean NOT NULL DEFAULT false;

-- Index for fast sort queries
CREATE INDEX IF NOT EXISTS idx_organizations_is_partner
  ON public.organizations(is_partner)
  WHERE is_partner = true AND deleted_at IS NULL;

COMMENT ON COLUMN public.organizations.is_partner IS
  'Partner tier: org sorts first in all discovery carousels across the app (state-filtered). '
  'Enhanced tier uses is_featured=true for home-page-only priority.';
