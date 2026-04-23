-- =====================================================================
-- Migration 012 — Tier system: add 'partner' tier + waitlist table
-- =====================================================================
-- Adds the third tier ('partner') for high-touch ministry partners and
-- creates a tier_upgrade_requests waitlist table to capture interest
-- BEFORE Stripe billing is wired up. Once the LLC + Stripe Payment Links
-- are live, the waitlist becomes the warm-lead list to convert.
-- =====================================================================

-- 1. Extend the org_tier enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'partner'
      AND enumtypid = 'public.org_tier'::regtype
  ) THEN
    ALTER TYPE public.org_tier ADD VALUE 'partner';
  END IF;
END $$;

-- 2. Seed the partner tier definition
INSERT INTO public.org_tiers (name, display_name, max_members, max_events, max_opportunities, can_feature_content, can_promote)
VALUES ('partner', 'Partner', NULL, NULL, NULL, true, true)
ON CONFLICT (name) DO UPDATE SET
  display_name        = EXCLUDED.display_name,
  max_members         = EXCLUDED.max_members,
  max_events          = EXCLUDED.max_events,
  max_opportunities   = EXCLUDED.max_opportunities,
  can_feature_content = EXCLUDED.can_feature_content,
  can_promote         = EXCLUDED.can_promote;

-- Also make sure 'enhanced' has the right capabilities
UPDATE public.org_tiers
   SET can_feature_content = true,
       can_promote = false
 WHERE name = 'enhanced';

-- 3. Tier upgrade waitlist
CREATE TABLE IF NOT EXISTS public.tier_upgrade_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_tier    public.org_tier NOT NULL,
  requested_tier  public.org_tier NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'contacted', 'converted', 'declined', 'cancelled')),
  notes           text,
  contact_email   text,
  contact_phone   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tier_upgrade_requests_org    ON public.tier_upgrade_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_tier_upgrade_requests_user   ON public.tier_upgrade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_upgrade_requests_status ON public.tier_upgrade_requests(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_tier_upgrade_requests_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_tier_upgrade_requests_updated_at ON public.tier_upgrade_requests;
CREATE TRIGGER trg_tier_upgrade_requests_updated_at
  BEFORE UPDATE ON public.tier_upgrade_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_tier_upgrade_requests_updated_at();

-- 4. RLS
ALTER TABLE public.tier_upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Owners/admins of the org can see their own requests
DROP POLICY IF EXISTS "tier_requests_select_own_org" ON public.tier_upgrade_requests;
CREATE POLICY "tier_requests_select_own_org"
  ON public.tier_upgrade_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = tier_upgrade_requests.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('super_admin', 'moderator')
    )
  );

-- Owners/admins can create requests for their org
DROP POLICY IF EXISTS "tier_requests_insert_own_org" ON public.tier_upgrade_requests;
CREATE POLICY "tier_requests_insert_own_org"
  ON public.tier_upgrade_requests
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = tier_upgrade_requests.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

-- Requesters can cancel their own pending requests
DROP POLICY IF EXISTS "tier_requests_update_own" ON public.tier_upgrade_requests;
CREATE POLICY "tier_requests_update_own"
  ON public.tier_upgrade_requests
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Admins can update any request (status changes, notes)
DROP POLICY IF EXISTS "tier_requests_admin_update" ON public.tier_upgrade_requests;
CREATE POLICY "tier_requests_admin_update"
  ON public.tier_upgrade_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role IN ('super_admin', 'moderator')
    )
  );
