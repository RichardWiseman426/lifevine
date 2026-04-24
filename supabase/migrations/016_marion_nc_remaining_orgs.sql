-- ─────────────────────────────────────────────────────────────────────────────
-- 016: Relocate remaining 2 orgs to Marion, NC (28752) for beta testing
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_org2  uuid;  -- the-vine-counseling → Blue Ridge Counseling Center
  v_org3  uuid;  -- crossroads-recovery → Blue Ridge Recovery Network
BEGIN

  SELECT id INTO v_org2 FROM public.organizations WHERE slug = 'the-vine-counseling';
  SELECT id INTO v_org3 FROM public.organizations WHERE slug = 'crossroads-recovery';

  IF v_org2 IS NULL THEN RAISE WARNING 'the-vine-counseling not found — skipping'; END IF;
  IF v_org3 IS NULL THEN RAISE WARNING 'crossroads-recovery not found — skipping'; END IF;

  -- ── The Vine Counseling → Blue Ridge Counseling Center ───────────────────
  IF v_org2 IS NOT NULL THEN
    UPDATE public.organizations SET
      name             = 'Blue Ridge Counseling Center',
      slug             = 'blue-ridge-counseling',
      address_line1    = '115 East Court Street, Suite 2',
      city             = 'Marion',
      state            = 'NC',
      postal_code      = '28752',
      country          = 'US',
      phone            = '(828) 555-0188',
      email            = 'intake@blueridgecounseling.org',
      website_url      = 'https://blueridgecounseling.org',
      social_facebook  = 'https://facebook.com/blueridgecounseling',
      social_instagram = 'https://instagram.com/blueridgecounseling',
      service_times    = 'Mon–Fri: 9am–6pm · Saturdays by appointment',
      tags             = ARRAY['counseling', 'therapy', 'mental health', 'trauma', 'sliding scale', 'faith-based', 'Marion', 'McDowell County']
    WHERE id = v_org2;
  END IF;

  -- ── Crossroads Recovery → Blue Ridge Recovery Network ────────────────────
  IF v_org3 IS NOT NULL THEN
    UPDATE public.organizations SET
      name             = 'Blue Ridge Recovery Network',
      slug             = 'blue-ridge-recovery',
      address_line1    = '287 Sugar Hill Road',
      city             = 'Marion',
      state            = 'NC',
      postal_code      = '28752',
      country          = 'US',
      phone            = '(828) 555-0122',
      email            = 'connect@blueridgerecovery.org',
      website_url      = 'https://blueridgerecovery.org',
      social_facebook  = 'https://facebook.com/blueridgerecovery',
      social_instagram = NULL,
      service_times    = 'Support Groups: Mon, Wed, Fri at 7pm · Family Group: Sundays at 5pm',
      tags             = ARRAY['recovery', 'addiction', 'sobriety', 'peer support', 'family healing', 'community', 'Marion', 'Western NC']
    WHERE id = v_org3;
  END IF;

  -- ── Update events for both orgs ──────────────────────────────────────────
  UPDATE public.events
  SET city = 'Marion', state = 'NC'
  WHERE org_id IN (v_org2, v_org3)
    AND is_virtual = false;

  -- ── Update opportunities for both orgs ───────────────────────────────────
  UPDATE public.opportunities
  SET city = 'Marion', state = 'NC'
  WHERE org_id IN (v_org2, v_org3)
    AND is_remote = false;

  -- ── Update resources linked to these orgs ────────────────────────────────
  UPDATE public.resources SET
    city        = 'Marion',
    state       = 'NC',
    title       = 'Blue Ridge Counseling Center — Sliding Scale Therapy',
    phone       = '(828) 555-0188',
    email       = 'intake@blueridgecounseling.org',
    website_url = 'https://blueridgecounseling.org'
  WHERE org_id = v_org2;

  UPDATE public.resources SET
    city        = 'Marion',
    state       = 'NC',
    title       = 'Blue Ridge Recovery Network — Free Peer Support',
    phone       = '(828) 555-0122',
    email       = 'connect@blueridgerecovery.org',
    website_url = 'https://blueridgerecovery.org'
  WHERE org_id = v_org3;

  RAISE NOTICE 'Migration 016 complete — Blue Ridge Counseling Center and Blue Ridge Recovery Network now located in Marion, NC (28752). All 5 contributor categories now represented locally.';

END $$;
