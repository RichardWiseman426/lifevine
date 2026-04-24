-- ─────────────────────────────────────────────────────────────────────────────
-- 015: Relocate 3 seeded orgs to Marion, NC (28752) for beta testing
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_org1  uuid;  -- hope-community-church
  v_org4  uuid;  -- harvest-medical-ministry
  v_org5  uuid;  -- neighbor-network-dfw → neighbor-network-wnc
BEGIN

  SELECT id INTO v_org1 FROM public.organizations WHERE slug = 'hope-community-church';
  SELECT id INTO v_org4 FROM public.organizations WHERE slug = 'harvest-medical-ministry';
  SELECT id INTO v_org5 FROM public.organizations WHERE slug = 'neighbor-network-dfw';

  IF v_org1 IS NULL THEN RAISE WARNING 'hope-community-church not found — skipping'; END IF;
  IF v_org4 IS NULL THEN RAISE WARNING 'harvest-medical-ministry not found — skipping'; END IF;
  IF v_org5 IS NULL THEN RAISE WARNING 'neighbor-network-dfw not found — skipping'; END IF;

  -- ── Hope Community Church → Grace Mountain Church, Marion NC ─────────────
  IF v_org1 IS NOT NULL THEN
    UPDATE public.organizations SET
      name           = 'Grace Mountain Church',
      address_line1  = '182 Logan Street',
      city           = 'Marion',
      state          = 'NC',
      postal_code    = '28752',
      country        = 'US',
      phone          = '(828) 555-0141',
      email          = 'hello@gracemountainchurch.org',
      website_url    = 'https://gracemountainchurch.org',
      social_facebook  = 'https://facebook.com/gracemountainchurch',
      social_instagram = 'https://instagram.com/gracemountainchurch',
      social_youtube   = NULL,
      service_times  = 'Sundays: 9:00am & 11:00am · Wednesdays: 6:30pm Life Groups',
      tags           = ARRAY['church', 'family', 'worship', 'community', 'outreach', 'youth', 'Marion', 'McDowell County']
    WHERE id = v_org1;
  END IF;

  -- ── Harvest Medical Ministry → McDowell Community Health Ministry ─────────
  IF v_org4 IS NOT NULL THEN
    UPDATE public.organizations SET
      name           = 'McDowell Community Health Ministry',
      address_line1  = '400 Spaulding Road',
      city           = 'Marion',
      state          = 'NC',
      postal_code    = '28752',
      country        = 'US',
      phone          = '(828) 555-0176',
      email          = 'clinic@mcdowellhealthministry.org',
      website_url    = 'https://mcdowellhealthministry.org',
      social_facebook  = 'https://facebook.com/mcdowellhealthministry',
      social_instagram = 'https://instagram.com/mcdowellhealthministry',
      tags           = ARRAY['medical', 'free clinic', 'healthcare', 'volunteer physicians', 'uninsured', 'walk-in', 'Marion', 'McDowell County']
    WHERE id = v_org4;
  END IF;

  -- ── Neighbor Network DFW → Neighbor Network WNC ───────────────────────────
  IF v_org5 IS NOT NULL THEN
    UPDATE public.organizations SET
      name           = 'Neighbor Network WNC',
      slug           = 'neighbor-network-wnc',
      address_line1  = '39 North Main Street',
      city           = 'Marion',
      state          = 'NC',
      postal_code    = '28752',
      country        = 'US',
      phone          = '(828) 555-0109',
      email          = 'volunteer@neighbornetworkwnc.org',
      website_url    = 'https://neighbornetworkwnc.org',
      social_facebook  = 'https://facebook.com/neighbornetworkwnc',
      social_instagram = 'https://instagram.com/neighbornetworkwnc',
      social_twitter   = NULL,
      tags           = ARRAY['volunteer', 'community', 'neighbors', 'service', 'food', 'transportation', 'home repair', 'Marion', 'Western NC']
    WHERE id = v_org5;
  END IF;

  -- ── Update events for all 3 orgs ─────────────────────────────────────────
  UPDATE public.events
  SET city = 'Marion', state = 'NC'
  WHERE org_id IN (v_org1, v_org4, v_org5)
    AND is_virtual = false;

  -- ── Update opportunities for all 3 orgs ──────────────────────────────────
  UPDATE public.opportunities
  SET city = 'Marion', state = 'NC'
  WHERE org_id IN (v_org1, v_org4, v_org5)
    AND is_remote = false;

  -- ── Update resources linked to these orgs ────────────────────────────────
  UPDATE public.resources SET
    city = 'Marion', state = 'NC',
    title = 'McDowell Community Health Ministry — Free Walk-In Clinic',
    phone = '(828) 555-0176',
    email = 'clinic@mcdowellhealthministry.org',
    website_url = 'https://mcdowellhealthministry.org'
  WHERE org_id = v_org4;

  UPDATE public.resources SET
    city = 'Marion', state = 'NC',
    title = 'Neighbor Network WNC — Weekly Food Pantry',
    phone = '(828) 555-0109',
    email = 'volunteer@neighbornetworkwnc.org',
    website_url = 'https://neighbornetworkwnc.org'
  WHERE org_id = v_org5;

  UPDATE public.resources SET
    city = 'Marion', state = 'NC',
    title = 'Grace Mountain Church — Free Prayer Line',
    phone = '(828) 555-0141',
    email = 'hello@gracemountainchurch.org',
    website_url = 'https://gracemountainchurch.org'
  WHERE org_id = v_org1;

  RAISE NOTICE 'Migration 015 complete — Grace Mountain Church, McDowell Community Health Ministry, and Neighbor Network WNC now located in Marion, NC (28752). Associated events, opportunities, and resources updated.';

END $$;
