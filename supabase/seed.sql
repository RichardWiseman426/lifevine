-- ============================================================
-- LifeVine Seed Data
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- after running all migrations.
-- ============================================================

DO $$
DECLARE
  v_uid       uuid;
  v_org1      uuid := gen_random_uuid();
  v_org2      uuid := gen_random_uuid();
  v_org3      uuid := gen_random_uuid();
  v_org4      uuid := gen_random_uuid();
  v_org5      uuid := gen_random_uuid();
  v_event1    uuid := gen_random_uuid();
  v_sched1    uuid := gen_random_uuid();
  v_occ1      uuid := gen_random_uuid();
  v_event2    uuid := gen_random_uuid();
  v_sched2    uuid := gen_random_uuid();
  v_occ2      uuid := gen_random_uuid();
BEGIN
  -- ── Find the super_admin user (Richard) ────────────────────
  SELECT id INTO v_uid
  FROM public.profiles
  WHERE platform_role = 'super_admin'
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No super_admin profile found. Sign in first and retry.';
  END IF;

  -- ── Set first_name / last_name on Richard's profile ────────
  UPDATE public.profiles
  SET first_name = 'Richard',
      last_name  = 'Wiseman',
      display_name = 'Richard Wiseman'
  WHERE id = v_uid;

  -- ── Featured Organizations ──────────────────────────────────

  INSERT INTO public.organizations (
    id, slug, name, short_description, description,
    category, city, state, country,
    tier, is_active, is_featured, is_verified,
    created_by
  ) VALUES
  (
    v_org1, 'hope-community-church', 'Hope Community Church',
    'A welcoming church family committed to authentic faith, radical generosity, and real community.',
    'Hope Community Church has been serving the Dallas-Fort Worth area for over 25 years. We believe church is not a building — it is a family. Whether you are walking through hardship, searching for purpose, or simply looking to belong, our doors are open.',
    'church', 'Dallas', 'TX', 'US',
    'enhanced', true, true, true, v_uid
  ),
  (
    v_org2, 'the-vine-counseling', 'The Vine Counseling Center',
    'Licensed Christian counselors providing affordable therapy for individuals, couples, and families.',
    'The Vine Counseling Center offers professional, faith-integrated counseling services on a sliding scale. Our team of licensed therapists is trained in trauma, grief, marriage, and anxiety. No one is turned away for inability to pay.',
    'therapy', 'Fort Worth', 'TX', 'US',
    'enhanced', true, true, true, v_uid
  ),
  (
    v_org3, 'crossroads-recovery', 'Crossroads Recovery Network',
    'A peer-led support community for individuals and families navigating addiction and recovery.',
    'Crossroads Recovery Network connects people in every stage of recovery — from day one to year twenty. We host weekly support groups, one-on-one mentorship, and family healing workshops. Recovery is a community effort.',
    'support_group', 'Arlington', 'TX', 'US',
    'free', true, true, false, v_uid
  ),
  (
    v_org4, 'harvest-medical-ministry', 'Harvest Medical Ministry',
    'Free and low-cost medical care for uninsured and underinsured neighbors in our community.',
    'Harvest Medical Ministry operates a walk-in clinic staffed by volunteer physicians, nurse practitioners, and medical students. We treat physical illness as one part of whole-person healing — and we never send a bill.',
    'medical', 'Dallas', 'TX', 'US',
    'enhanced', true, true, true, v_uid
  ),
  (
    v_org5, 'neighbor-network-dfw', 'Neighbor Network DFW',
    'Connecting volunteers with neighbors in need — food, transportation, home repair, and more.',
    'Neighbor Network DFW is a grassroots volunteer coordination platform. We match people who have time, skills, or resources with neighbors who have real, immediate needs. Every act of service matters.',
    'community', 'Dallas', 'TX', 'US',
    'free', true, true, false, v_uid
  )
  ON CONFLICT (slug) DO NOTHING;

  -- ── Events ─────────────────────────────────────────────────

  -- Event 1: Community Prayer Night (upcoming this week)
  INSERT INTO public.events (
    id, org_id, created_by,
    title, short_description, description,
    category, city, state, country,
    is_virtual, is_public, status, is_featured
  ) VALUES (
    v_event1, v_org1, v_uid,
    'Community Prayer Night',
    'An open evening of prayer, worship, and connection for anyone in the DFW area.',
    'Join us for a warm, informal evening of prayer and worship. No agenda, no performance — just people gathering together. Light refreshments provided.',
    'community', 'Dallas', 'TX', 'US',
    false, true, 'approved', true
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_schedules (
    id, event_id, recurrence, starts_at, ends_at, timezone
  ) VALUES (
    v_sched1, v_event1, 'none',
    (now() + interval '3 days')::date + time '19:00:00',
    (now() + interval '3 days')::date + time '21:00:00',
    'America/Chicago'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_occurrences (
    id, event_id, schedule_id, starts_at, ends_at, status
  ) VALUES (
    v_occ1, v_event1, v_sched1,
    (now() + interval '3 days')::date + time '19:00:00',
    (now() + interval '3 days')::date + time '21:00:00',
    'scheduled'
  ) ON CONFLICT DO NOTHING;

  -- Event 2: Volunteer Orientation (upcoming next week)
  INSERT INTO public.events (
    id, org_id, created_by,
    title, short_description, description,
    category, city, state, country,
    is_virtual, is_public, status, is_featured
  ) VALUES (
    v_event2, v_org5, v_uid,
    'Volunteer Orientation — Spring Cohort',
    'New to Neighbor Network? This 90-minute orientation is your on-ramp to making a real difference.',
    'Learn how Neighbor Network works, meet other volunteers, and get matched with your first service opportunity. Orientation is required for all new volunteers. Coffee and snacks provided.',
    'service', 'Dallas', 'TX', 'US',
    false, true, 'approved', false
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_schedules (
    id, event_id, recurrence, starts_at, ends_at, timezone
  ) VALUES (
    v_sched2, v_event2, 'none',
    (now() + interval '6 days')::date + time '10:00:00',
    (now() + interval '6 days')::date + time '11:30:00',
    'America/Chicago'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_occurrences (
    id, event_id, schedule_id, starts_at, ends_at, status
  ) VALUES (
    v_occ2, v_event2, v_sched2,
    (now() + interval '6 days')::date + time '10:00:00',
    (now() + interval '6 days')::date + time '11:30:00',
    'scheduled'
  ) ON CONFLICT DO NOTHING;

  -- ── RSVPs (Richard is attending both events) ────────────────
  INSERT INTO public.event_rsvps (occurrence_id, user_id, guest_count)
  VALUES
    (v_occ1, v_uid, 1),
    (v_occ2, v_uid, 1)
  ON CONFLICT (occurrence_id, user_id) DO NOTHING;

  RAISE NOTICE 'Seed complete. User: %, Featured orgs: 5, Events: 2, RSVPs: 2', v_uid;
END $$;
