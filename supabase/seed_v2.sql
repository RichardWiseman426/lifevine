-- ============================================================
-- LifeVine Seed Data v2 — Full App Population
--
-- Run this AFTER seed.sql and AFTER all migrations including 011.
-- Safe to re-run — uses ON CONFLICT DO NOTHING throughout.
--
-- Populates:
--   • Extended org profile fields (mission, services, pastor, social)
--   • Org membership for Richard
--   • 5 additional events with schedules + occurrences
--   • 8 volunteer opportunities with actionable steps
--   • 8 approved testimonies + responses
--   • 12 support resources (all categories, crisis included)
--   • 2 pending contributor applications (for admin panel)
-- ============================================================

DO $$
DECLARE
  v_uid        uuid;

  -- Existing org IDs (looked up by slug)
  v_org1       uuid;  -- hope-community-church
  v_org2       uuid;  -- the-vine-counseling
  v_org3       uuid;  -- crossroads-recovery
  v_org4       uuid;  -- harvest-medical-ministry
  v_org5       uuid;  -- neighbor-network-dfw

  -- New event vars
  v_event3     uuid := gen_random_uuid();
  v_sched3     uuid := gen_random_uuid();
  v_occ3       uuid := gen_random_uuid();

  v_event4     uuid := gen_random_uuid();
  v_sched4     uuid := gen_random_uuid();
  v_occ4       uuid := gen_random_uuid();

  v_event5     uuid := gen_random_uuid();
  v_sched5     uuid := gen_random_uuid();
  v_occ5       uuid := gen_random_uuid();

  v_event6     uuid := gen_random_uuid();
  v_sched6     uuid := gen_random_uuid();
  v_occ6       uuid := gen_random_uuid();

  v_event7     uuid := gen_random_uuid();
  v_sched7     uuid := gen_random_uuid();
  v_occ7       uuid := gen_random_uuid();

  -- Opportunity vars
  v_opp1       uuid := gen_random_uuid();
  v_opp2       uuid := gen_random_uuid();
  v_opp3       uuid := gen_random_uuid();
  v_opp4       uuid := gen_random_uuid();
  v_opp5       uuid := gen_random_uuid();
  v_opp6       uuid := gen_random_uuid();
  v_opp7       uuid := gen_random_uuid();
  v_opp8       uuid := gen_random_uuid();

  -- Testimony vars
  v_test1      uuid := gen_random_uuid();
  v_test2      uuid := gen_random_uuid();
  v_test3      uuid := gen_random_uuid();
  v_test4      uuid := gen_random_uuid();
  v_test5      uuid := gen_random_uuid();
  v_test6      uuid := gen_random_uuid();
  v_test7      uuid := gen_random_uuid();
  v_test8      uuid := gen_random_uuid();

  -- Resource vars
  v_res1       uuid := gen_random_uuid();
  v_res2       uuid := gen_random_uuid();
  v_res3       uuid := gen_random_uuid();
  v_res4       uuid := gen_random_uuid();
  v_res5       uuid := gen_random_uuid();
  v_res6       uuid := gen_random_uuid();
  v_res7       uuid := gen_random_uuid();
  v_res8       uuid := gen_random_uuid();
  v_res9       uuid := gen_random_uuid();
  v_res10      uuid := gen_random_uuid();
  v_res11      uuid := gen_random_uuid();
  v_res12      uuid := gen_random_uuid();

BEGIN

  -- ── Find Richard (super_admin) ──────────────────────────────
  SELECT id INTO v_uid
  FROM public.profiles
  WHERE platform_role = 'super_admin'
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No super_admin profile found. Sign in first, then retry.';
  END IF;

  -- ── Look up existing org IDs by slug ────────────────────────
  SELECT id INTO v_org1 FROM public.organizations WHERE slug = 'hope-community-church';
  SELECT id INTO v_org2 FROM public.organizations WHERE slug = 'the-vine-counseling';
  SELECT id INTO v_org3 FROM public.organizations WHERE slug = 'crossroads-recovery';
  SELECT id INTO v_org4 FROM public.organizations WHERE slug = 'harvest-medical-ministry';
  SELECT id INTO v_org5 FROM public.organizations WHERE slug = 'neighbor-network-dfw';

  IF v_org1 IS NULL THEN
    RAISE EXCEPTION 'Base seed (seed.sql) has not been run yet. Run seed.sql first.';
  END IF;


  -- ════════════════════════════════════════════════════════════
  -- 1. ENRICH EXISTING ORGS WITH EXTENDED FIELDS
  -- ════════════════════════════════════════════════════════════

  -- Hope Community Church
  UPDATE public.organizations SET
    mission_statement  = 'To know Christ and make Him known — building a community where every person belongs, grows, and serves.',
    service_times      = 'Sundays: 8:30am, 10:00am & 11:45am · Wednesdays: 6:30pm Life Groups',
    services_offered   = ARRAY['Worship Services', 'Life Groups', 'Youth Ministry', 'Kids Church', 'Marriage Counseling', 'Food Pantry', 'Community Outreach'],
    social_facebook    = 'https://facebook.com/hopecommunitychurchdfw',
    social_instagram   = 'https://instagram.com/hopechurchdfw',
    social_youtube     = 'https://youtube.com/@hopechurchdfw',
    pastor_name        = 'Pastor James Whitfield',
    pastor_title       = 'Lead Pastor',
    pastor_bio         = 'Pastor James has served the DFW community for over 18 years. He and his wife Carolyn have three children and are deeply committed to building a church that feels like home for everyone — regardless of background or history.',
    address_line1      = '4800 Legacy Drive',
    postal_code        = '75024',
    email              = 'hello@hopechurchdfw.org',
    phone              = '(972) 555-0141',
    website_url        = 'https://hopechurchdfw.org',
    tags               = ARRAY['church', 'family', 'worship', 'community', 'outreach', 'youth']
  WHERE id = v_org1;

  -- The Vine Counseling Center
  UPDATE public.organizations SET
    mission_statement  = 'Bringing healing to the whole person — spirit, soul, and body — through professional, faith-integrated counseling.',
    service_times      = 'Mon–Fri: 9am–6pm · Saturdays by appointment',
    services_offered   = ARRAY['Individual Therapy', 'Couples Counseling', 'Family Therapy', 'Trauma Recovery', 'Grief Support', 'Anxiety & Depression', 'Sliding Scale Fee'],
    practice_details   = 'Our therapists integrate evidence-based clinical techniques — including EMDR, CBT, and attachment-based therapy — with a faith-sensitive approach. We welcome clients of all backgrounds and beliefs. No one is turned away due to financial hardship.',
    social_instagram   = 'https://instagram.com/thevinecounseling',
    social_facebook    = 'https://facebook.com/thevinecounseling',
    address_line1      = '2901 Alta Mere Drive, Suite 110',
    postal_code        = '76116',
    email              = 'intake@thevinecounseling.org',
    phone              = '(817) 555-0188',
    website_url        = 'https://thevinecounseling.org',
    tags               = ARRAY['counseling', 'therapy', 'mental health', 'trauma', 'sliding scale', 'faith-based']
  WHERE id = v_org2;

  -- Crossroads Recovery Network
  UPDATE public.organizations SET
    mission_statement  = 'Nobody walks the road to recovery alone. We are a community built by people in recovery, for people in recovery.',
    service_times      = 'Support Groups: Mon, Wed, Fri at 7pm · Family Group: Sundays at 5pm',
    services_offered   = ARRAY['Peer Support Groups', 'One-on-One Mentorship', 'Family Healing Workshops', 'Sober Social Events', 'Recovery Coaching', '12-Step Facilitation'],
    practice_details   = 'We are a peer-led, not a clinical, program. All our facilitators are in long-term recovery themselves. We partner with licensed counselors for cases requiring clinical support.',
    social_facebook    = 'https://facebook.com/crossroadsrecovery',
    address_line1      = '600 Six Flags Drive, Suite 200',
    postal_code        = '76011',
    email              = 'connect@crossroadsrecovery.net',
    phone              = '(682) 555-0122',
    website_url        = 'https://crossroadsrecovery.net',
    tags               = ARRAY['recovery', 'addiction', 'sobriety', 'peer support', 'family healing', 'community']
  WHERE id = v_org3;

  -- Harvest Medical Ministry
  UPDATE public.organizations SET
    mission_statement  = 'Treating the whole person. No appointment. No bill. No barriers.',
    service_times      = 'Walk-In Clinic: Tues & Thurs 9am–1pm, Sat 9am–12pm',
    services_offered   = ARRAY['Primary Care', 'Preventive Screenings', 'Prescription Assistance', 'Women''s Health', 'Pediatric Care', 'Mental Health Referrals', 'Lab Work'],
    practice_details   = 'Staffed by licensed volunteer physicians, nurse practitioners, and supervised medical students. We follow evidence-based clinical guidelines and maintain full medical records. Patients are treated with the same dignity and standard of care as any private practice.',
    social_facebook    = 'https://facebook.com/harvestmedicalministry',
    social_instagram   = 'https://instagram.com/harvestmedical',
    address_line1      = '3200 S Lancaster Rd',
    postal_code        = '75216',
    email              = 'clinic@harvestmedical.org',
    phone              = '(214) 555-0176',
    website_url        = 'https://harvestmedical.org',
    tags               = ARRAY['medical', 'free clinic', 'healthcare', 'volunteer physicians', 'uninsured', 'walk-in']
  WHERE id = v_org4;

  -- Neighbor Network DFW
  UPDATE public.organizations SET
    mission_statement  = 'Every act of service matters. We connect willing hands with real needs — one neighbor at a time.',
    service_times      = 'Volunteer Coordination: Mon–Sat 8am–5pm · 24hr need submission online',
    services_offered   = ARRAY['Grocery Delivery', 'Transportation Assistance', 'Home Repair', 'Yard Work', 'Moving Help', 'Errand Running', 'Companionship Visits'],
    social_facebook    = 'https://facebook.com/neighbornetworkdfw',
    social_instagram   = 'https://instagram.com/neighbornetworkdfw',
    social_twitter     = 'https://twitter.com/neighbornetdfw',
    address_line1      = '1600 Pacific Ave, Suite 300',
    postal_code        = '75201',
    email              = 'volunteer@neighbornetworkdfw.org',
    phone              = '(214) 555-0109',
    website_url        = 'https://neighbornetworkdfw.org',
    tags               = ARRAY['volunteer', 'community', 'neighbors', 'service', 'food', 'transportation', 'home repair']
  WHERE id = v_org5;


  -- ════════════════════════════════════════════════════════════
  -- 2. ORG MEMBERSHIP — Richard owns Hope Community Church
  -- ════════════════════════════════════════════════════════════

  INSERT INTO public.org_members (org_id, user_id, role, status, joined_at)
  VALUES (v_org1, v_uid, 'owner', 'active', now())
  ON CONFLICT (org_id, user_id) DO NOTHING;


  -- ════════════════════════════════════════════════════════════
  -- 3. ADDITIONAL EVENTS (5 more)
  -- ════════════════════════════════════════════════════════════

  -- Event 3: Financial Literacy Workshop (virtual, Hope Church)
  INSERT INTO public.events (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_virtual, virtual_url, is_public, status, is_featured)
  VALUES (v_event3, v_org1, v_uid,
    'Financial Freedom Workshop',
    'A practical, faith-based guide to budgeting, debt freedom, and generosity.',
    'Join us for a free two-hour workshop covering biblical principles of money management. Topics include building a budget that works, getting out of debt, emergency savings, and the joy of giving. All experience levels welcome — no financial background required. This event is held online.',
    'workshop', 'Dallas', 'TX', 'US',
    true, 'https://zoom.us/j/placeholder', true, 'approved', false
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_schedules (id, event_id, recurrence, starts_at, ends_at, timezone)
  VALUES (v_sched3, v_event3, 'none',
    (now() + interval '8 days')::date + time '18:30:00',
    (now() + interval '8 days')::date + time '20:30:00',
    'America/Chicago'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_occurrences (id, event_id, schedule_id, starts_at, ends_at, status)
  VALUES (v_occ3, v_event3, v_sched3,
    (now() + interval '8 days')::date + time '18:30:00',
    (now() + interval '8 days')::date + time '20:30:00',
    'scheduled'
  ) ON CONFLICT DO NOTHING;

  -- Event 4: Recovery Open House (Crossroads Recovery)
  INSERT INTO public.events (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_virtual, is_public, status, is_featured)
  VALUES (v_event4, v_org3, v_uid,
    'Recovery Open House',
    'Curious about Crossroads? Come meet the community in a low-pressure, come-as-you-are open house.',
    'No commitment required. Come learn what Crossroads Recovery Network is all about, meet people who are walking the same road, and find out if our program is a good fit. Spouses, parents, and family members are encouraged to come. Light dinner provided.',
    'support', 'Arlington', 'TX', 'US',
    false, true, 'approved', false
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_schedules (id, event_id, recurrence, starts_at, ends_at, timezone)
  VALUES (v_sched4, v_event4, 'none',
    (now() + interval '10 days')::date + time '17:30:00',
    (now() + interval '10 days')::date + time '19:30:00',
    'America/Chicago'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_occurrences (id, event_id, schedule_id, starts_at, ends_at, status)
  VALUES (v_occ4, v_event4, v_sched4,
    (now() + interval '10 days')::date + time '17:30:00',
    (now() + interval '10 days')::date + time '19:30:00',
    'scheduled'
  ) ON CONFLICT DO NOTHING;

  -- Event 5: Community Health Fair (Harvest Medical Ministry)
  INSERT INTO public.events (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_virtual, is_public, status, is_featured)
  VALUES (v_event5, v_org4, v_uid,
    'Free Community Health Fair',
    'Free health screenings, blood pressure checks, and resource tables for the whole community.',
    'Harvest Medical Ministry is hosting a free community health fair open to all Dallas-area residents. Free services include blood pressure screenings, blood glucose testing, BMI assessments, vision screenings, and dental check-ups. Community organizations will have resource tables on-site. No ID or insurance required. Children and families welcome.',
    'service', 'Dallas', 'TX', 'US',
    false, true, 'approved', true
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_schedules (id, event_id, recurrence, starts_at, ends_at, timezone)
  VALUES (v_sched5, v_event5, 'none',
    (now() + interval '14 days')::date + time '09:00:00',
    (now() + interval '14 days')::date + time '14:00:00',
    'America/Chicago'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_occurrences (id, event_id, schedule_id, starts_at, ends_at, status)
  VALUES (v_occ5, v_event5, v_sched5,
    (now() + interval '14 days')::date + time '09:00:00',
    (now() + interval '14 days')::date + time '14:00:00',
    'scheduled'
  ) ON CONFLICT DO NOTHING;

  -- Event 6: Youth Game Night (Hope Community Church)
  INSERT INTO public.events (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_virtual, is_public, status, is_featured)
  VALUES (v_event6, v_org1, v_uid,
    'Youth Game Night',
    'Middle and high school students — come for games, food, and great community. All are welcome.',
    'A fun, safe space for 6th–12th graders to hang out, play games, and build friendships. We''ll have board games, video games, Gaga ball, and pizza. No registration required — just show up. Parents are welcome to stay.',
    'community', 'Dallas', 'TX', 'US',
    false, true, 'approved', false
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_schedules (id, event_id, recurrence, starts_at, ends_at, timezone)
  VALUES (v_sched6, v_event6, 'none',
    (now() + interval '5 days')::date + time '18:00:00',
    (now() + interval '5 days')::date + time '20:30:00',
    'America/Chicago'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_occurrences (id, event_id, schedule_id, starts_at, ends_at, status)
  VALUES (v_occ6, v_event6, v_sched6,
    (now() + interval '5 days')::date + time '18:00:00',
    (now() + interval '5 days')::date + time '20:30:00',
    'scheduled'
  ) ON CONFLICT DO NOTHING;

  -- Event 7: Marriage Enrichment Day (The Vine Counseling)
  INSERT INTO public.events (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_virtual, is_public, status, is_featured)
  VALUES (v_event7, v_org2, v_uid,
    'Marriage Enrichment Day',
    'A one-day investment in your most important relationship. Free for all couples.',
    'Led by The Vine''s licensed marriage therapists, this day-long workshop covers communication tools, conflict repair, rebuilding trust, and deepening emotional intimacy. Couples at every stage — newly married to decades in — find value here. Lunch included. Space is limited; RSVP encouraged.',
    'workshop', 'Fort Worth', 'TX', 'US',
    false, true, 'approved', false
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_schedules (id, event_id, recurrence, starts_at, ends_at, timezone)
  VALUES (v_sched7, v_event7, 'none',
    (now() + interval '21 days')::date + time '09:00:00',
    (now() + interval '21 days')::date + time '16:00:00',
    'America/Chicago'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.event_occurrences (id, event_id, schedule_id, starts_at, ends_at, status)
  VALUES (v_occ7, v_event7, v_sched7,
    (now() + interval '21 days')::date + time '09:00:00',
    (now() + interval '21 days')::date + time '16:00:00',
    'scheduled'
  ) ON CONFLICT DO NOTHING;


  -- ════════════════════════════════════════════════════════════
  -- 4. OPPORTUNITIES (8, with actionable steps)
  -- ════════════════════════════════════════════════════════════

  -- Opp 1: Food Pantry Volunteer
  INSERT INTO public.opportunities (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_remote, is_featured, status,
    commitment_hours, commitment_description,
    spots_total, spots_filled,
    contact_name, contact_email, contact_phone, tags)
  VALUES (v_opp1, v_org5, v_uid,
    'Food Pantry Volunteer',
    'Help sort, pack, and distribute groceries to families in need every Saturday morning.',
    'Neighbor Network DFW runs a weekly food pantry serving over 200 families each Saturday. We need volunteers to help unload deliveries, sort and bag groceries, set up the distribution area, and serve families directly. No experience required — just a willing heart and comfortable shoes. Shifts are 3 hours.',
    'volunteer', 'Dallas', 'TX', 'US',
    false, true, 'open',
    3, 'Every Saturday, 8:00am–11:00am',
    20, 7,
    'Maria Gonzalez', 'maria@neighbornetworkdfw.org', '(214) 555-0109',
    ARRAY['food', 'pantry', 'families', 'weekly', 'morning']
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.opportunity_steps (opportunity_id, step_order, title, description, action_type, action_label)
  VALUES
    (v_opp1, 1, 'Sign Up Online', 'Register for your first shift through our volunteer portal.', 'link', 'Sign Up Now'),
    (v_opp1, 2, 'Attend Orientation', 'Brief 15-minute orientation runs at 7:45am on your first Saturday.', 'show_up', 'See Location'),
    (v_opp1, 3, 'Show Up & Serve', 'Arrive at 8am on Saturday. Wear comfortable clothes you don''t mind getting dirty.', 'show_up', 'Get Directions')
  ON CONFLICT DO NOTHING;

  -- Opp 2: Prayer Team Volunteer
  INSERT INTO public.opportunities (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_remote, is_featured, status,
    commitment_hours, commitment_description,
    spots_total, spots_filled,
    contact_name, contact_email, contact_phone, tags)
  VALUES (v_opp2, v_org1, v_uid,
    'Sunday Prayer Team',
    'Serve on the prayer team before and after Sunday services — interceding for our congregation.',
    'The Hope Community prayer team gathers 30 minutes before each service to pray together and 30 minutes after to pray with anyone who comes forward. This is a meaningful, low-pressure way to serve. No formal training required — just a heart for prayer.',
    'volunteer', 'Dallas', 'TX', 'US',
    false, false, 'open',
    1, 'Sundays, one service slot per month minimum',
    NULL, 3,
    'Pastor James Whitfield', 'hello@hopechurchdfw.org', '(972) 555-0141',
    ARRAY['prayer', 'church', 'sunday', 'spiritual', 'intercession']
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.opportunity_steps (opportunity_id, step_order, title, description, action_type, action_label)
  VALUES
    (v_opp2, 1, 'Reach Out to Pastor James', 'Send an email expressing your interest. He personally welcomes every new prayer team member.', 'email', 'Send Email'),
    (v_opp2, 2, 'Attend a Team Gathering', 'Join us any Sunday — arrive 30 minutes before the service of your choice.', 'show_up', 'Get Directions')
  ON CONFLICT DO NOTHING;

  -- Opp 3: Volunteer Driver — Medical Transport
  INSERT INTO public.opportunities (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_remote, is_featured, status,
    commitment_hours, commitment_description,
    spots_total, spots_filled,
    contact_name, contact_email, contact_phone, tags)
  VALUES (v_opp3, v_org4, v_uid,
    'Volunteer Medical Transport Driver',
    'Drive patients without transportation to and from their clinic appointments.',
    'Many of our patients cannot afford a ride to their medical appointments. As a volunteer driver, you''ll be matched with patients near your area and provide round-trip transportation to our Dallas clinic. Flexible scheduling — you choose when you''re available. Background check required (we cover the cost).',
    'community_need', 'Dallas', 'TX', 'US',
    false, false, 'open',
    2, 'Flexible — choose your own schedule',
    10, 4,
    'Dr. Ruth Okafor', 'volunteer@harvestmedical.org', '(214) 555-0176',
    ARRAY['driving', 'transportation', 'medical', 'flexible', 'background check']
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.opportunity_steps (opportunity_id, step_order, title, description, action_type, action_label)
  VALUES
    (v_opp3, 1, 'Submit Your Application', 'Fill out our short volunteer driver application. Takes about 5 minutes.', 'link', 'Apply Now'),
    (v_opp3, 2, 'Background Check', 'We''ll send you a link to complete a free background check. Results take 3–5 business days.', 'email', 'Contact Us'),
    (v_opp3, 3, 'Get Matched with Patients', 'Once cleared, our coordinator will match you with patients near your area.', 'phone', 'Call Us')
  ON CONFLICT DO NOTHING;

  -- Opp 4: Recovery Mentor
  INSERT INTO public.opportunities (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_remote, is_featured, status,
    commitment_hours, commitment_description,
    spots_total, spots_filled,
    contact_name, contact_email, contact_phone, tags)
  VALUES (v_opp4, v_org3, v_uid,
    'Peer Recovery Mentor',
    'If you are in long-term recovery, share your story and walk alongside someone just starting out.',
    'Our mentorship program pairs people in early recovery (0–18 months) with a mentor who has at least two years of sustained sobriety. Mentors meet with their mentees weekly — in person or by phone — for encouragement, accountability, and practical support. Minimum 6-month commitment. Training provided.',
    'volunteer', 'Arlington', 'TX', 'US',
    false, true, 'open',
    2, '1–2 hours per week for at least 6 months',
    8, 5,
    'Tony Reeves', 'connect@crossroadsrecovery.net', '(682) 555-0122',
    ARRAY['recovery', 'mentorship', 'sobriety', 'peer support', 'long-term commitment']
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.opportunity_steps (opportunity_id, step_order, title, description, action_type, action_label)
  VALUES
    (v_opp4, 1, 'Call or Email Tony', 'Reach out to our Mentor Coordinator to share your story and ask questions.', 'phone', 'Call Tony'),
    (v_opp4, 2, 'Attend Mentor Training', 'One Saturday training session (9am–1pm) covers our program guidelines and mentorship skills.', 'show_up', 'See Schedule'),
    (v_opp4, 3, 'Meet Your Mentee', 'We''ll match you with a mentee and facilitate your first meeting together.', 'show_up', 'Learn More')
  ON CONFLICT DO NOTHING;

  -- Opp 5: Tech Volunteer (Remote)
  INSERT INTO public.opportunities (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_remote, is_featured, status,
    commitment_hours, commitment_description,
    spots_total, spots_filled,
    contact_name, contact_email, contact_phone, tags)
  VALUES (v_opp5, v_org5, v_uid,
    'Website & Tech Help (Remote)',
    'Help us keep our volunteer portal running smoothly — website updates, forms, and basic IT support.',
    'Neighbor Network DFW needs tech-savvy volunteers to help manage our website, troubleshoot volunteer registration forms, and assist staff with basic IT needs. Work is done fully remotely on your own schedule. We use WordPress, Google Workspace, and Airtable. Any skill level above "beginner" welcome.',
    'volunteer', 'Dallas', 'TX', 'US',
    true, false, 'open',
    3, '2–4 hours per month, flexible',
    5, 1,
    'Sam Carter', 'volunteer@neighbornetworkdfw.org', '(214) 555-0109',
    ARRAY['tech', 'remote', 'website', 'wordpress', 'flexible', 'IT']
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.opportunity_steps (opportunity_id, step_order, title, description, action_type, action_label)
  VALUES
    (v_opp5, 1, 'Send Us an Email', 'Introduce yourself and tell us a bit about your tech background. No formal resume needed.', 'email', 'Email Sam'),
    (v_opp5, 2, 'Quick 20-Minute Call', 'We''ll hop on a brief video call to explain what we need and see if it''s a good fit.', 'phone', 'Schedule a Call')
  ON CONFLICT DO NOTHING;

  -- Opp 6: Counseling Intake Assistant
  INSERT INTO public.opportunities (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_remote, is_featured, status,
    commitment_hours, commitment_description,
    spots_total, spots_filled,
    contact_name, contact_email, contact_phone, tags)
  VALUES (v_opp6, v_org2, v_uid,
    'Counseling Intake Volunteer',
    'Help new clients feel welcomed and supported as they take their first step toward healing.',
    'Our intake volunteers greet new clients, assist with intake paperwork, answer general questions, and connect people with the right therapist on our team. This is a deeply meaningful role — you are often the first warm face someone sees when they are at a vulnerable point. Training and supervision provided. Must be comfortable with sensitive conversations.',
    'volunteer', 'Fort Worth', 'TX', 'US',
    false, false, 'open',
    2, 'One weekday afternoon per week (3pm–6pm)',
    4, 2,
    'Lisa Tran', 'intake@thevinecounseling.org', '(817) 555-0188',
    ARRAY['counseling', 'intake', 'mental health', 'compassionate', 'training provided']
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.opportunity_steps (opportunity_id, step_order, title, description, action_type, action_label)
  VALUES
    (v_opp6, 1, 'Express Interest', 'Email Lisa our Intake Coordinator to let her know you''re interested.', 'email', 'Email Lisa'),
    (v_opp6, 2, 'In-Person Interview', 'Brief 30-minute in-person conversation at our Fort Worth office.', 'show_up', 'Get Address'),
    (v_opp6, 3, 'Volunteer Orientation', 'Two-hour training session covering confidentiality, intake process, and communication skills.', 'show_up', 'See Schedule')
  ON CONFLICT DO NOTHING;

  -- Opp 7: Youth Mentor
  INSERT INTO public.opportunities (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_remote, is_featured, status,
    commitment_hours, commitment_description,
    spots_total, spots_filled,
    contact_name, contact_email, contact_phone, tags)
  VALUES (v_opp7, v_org1, v_uid,
    'Youth Mentor — Middle School',
    'Invest in the next generation. Mentor a 6th–8th grader through our after-school program.',
    'Our middle school mentorship program matches adult volunteers with students in grades 6–8 for weekly one-on-one time. You''ll meet at the church for homework help, life conversations, and activities. Many of our students come from single-parent homes and simply need a consistent, caring adult in their corner. Background check required.',
    'volunteer', 'Dallas', 'TX', 'US',
    false, false, 'open',
    2, 'Once per week, Tuesdays 3:30–5:00pm',
    10, 6,
    'Pastor James Whitfield', 'hello@hopechurchdfw.org', '(972) 555-0141',
    ARRAY['youth', 'mentorship', 'middle school', 'weekly', 'students']
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.opportunity_steps (opportunity_id, step_order, title, description, action_type, action_label)
  VALUES
    (v_opp7, 1, 'Contact Pastor James', 'Reach out by email — he oversees the mentorship program personally.', 'email', 'Send Email'),
    (v_opp7, 2, 'Complete Background Check', 'Required for all youth volunteers. We cover the cost. Takes 3–5 days.', 'link', 'Start Check'),
    (v_opp7, 3, 'Meet Your Student', 'Once cleared, we''ll introduce you to your mentee and get the first session on the calendar.', 'show_up', 'See Location')
  ON CONFLICT DO NOTHING;

  -- Opp 8: Volunteer Clinic Assistant
  INSERT INTO public.opportunities (id, org_id, created_by, title, short_description, description,
    category, city, state, country, is_remote, is_featured, status,
    commitment_hours, commitment_description,
    spots_total, spots_filled,
    contact_name, contact_email, contact_phone, tags)
  VALUES (v_opp8, v_org4, v_uid,
    'Clinic Administrative Volunteer',
    'Support our medical team with patient check-in, paperwork, and a welcoming presence.',
    'Help our volunteer clinical staff run smoothly by assisting with patient check-in, filing, supply organization, and general front-desk tasks. No medical training required. Spanish speakers especially valued. This role is critical to our clinic running on time and our patients feeling cared for from the moment they arrive.',
    'volunteer', 'Dallas', 'TX', 'US',
    false, false, 'open',
    3, 'Tuesdays or Thursdays 8:30am–1:30pm',
    8, 3,
    'Dr. Ruth Okafor', 'volunteer@harvestmedical.org', '(214) 555-0176',
    ARRAY['medical', 'admin', 'clinic', 'spanish', 'check-in', 'welcoming']
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.opportunity_steps (opportunity_id, step_order, title, description, action_type, action_label)
  VALUES
    (v_opp8, 1, 'Call or Email Us', 'Reach out to our volunteer coordinator to express interest.', 'phone', 'Call the Clinic'),
    (v_opp8, 2, 'Come Visit the Clinic', 'Stop by during clinic hours — no appointment needed for a volunteer inquiry.', 'show_up', 'Get Directions')
  ON CONFLICT DO NOTHING;


  -- ════════════════════════════════════════════════════════════
  -- 5. TESTIMONIES (8 approved, mix of anonymous + attributed)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO public.testimonies (id, author_id, org_id, title, body, category,
    is_anonymous, status, is_featured, response_count)
  VALUES

  -- Testimony 1: Healing from addiction (anonymous, linked to Crossroads)
  (v_test1, v_uid, v_org3,
    'Two Years Sober — I Never Thought I''d Say That',
    'I walked into Crossroads Recovery with nothing. No hope, no plan, just a last-ditch attempt because my wife had left and I had burned every bridge I had. I expected judgment. I got the opposite.

The people in that room had been where I was. They didn''t look at me like I was broken. They looked at me like I was someone who hadn''t found his way yet. That changed everything.

Two years later I have my wife back. I have a relationship with my kids again. I am not "cured" — I know that. But I am not alone. Not anymore. If you are in that dark place right now, please reach out to Crossroads. You do not have to do this by yourself.',
    'healing', true, 'approved', true, 2),

  -- Testimony 2: Marriage restored (attributed, linked to The Vine)
  (v_test2, v_uid, v_org2,
    'Our Marriage Was Weeks Away From Ending',
    'My husband and I had agreed to separate. We had filed paperwork. The only reason we even tried The Vine Counseling was because our pastor asked us to — as a favor to him, not because we believed anything would change.

Six months later we are not just staying together. We are genuinely happy. Not perfect — real. Our counselor helped us see patterns we had been repeating for fifteen years without realizing it. She gave us tools we actually use every single day.

I do not tell this story to say it was easy. It was the hardest work either of us has ever done. But I tell it because someone out there is sitting exactly where we were sitting — convinced it is too far gone. It is not. Please reach out.',
    'restoration', false, 'approved', true, 3),

  -- Testimony 3: Found community after grief (anonymous, no org link)
  (v_test3, v_uid, NULL,
    'I Was Drowning in Grief and LifeVine Showed Me a Way Through',
    'After my mother passed last year, I became a ghost of myself. I went through the motions at work, stopped seeing friends, stopped going to church. I was functional on the outside and completely hollow on the inside.

I found LifeVine when I was searching for grief groups in our area. I did not really believe anything could help, but I filled out a form anyway.

Within a week I was connected with a grief support group through a local church I had never heard of. The group was small — just eight people — but they understood in a way no one else in my life could. Shared loss has a particular kind of language, and for the first time in months I felt understood.

I am still grieving. Grief does not end. But I am not drowning anymore. I am walking.',
    'community', true, 'approved', false, 1),

  -- Testimony 4: Employment after crisis (attributed)
  (v_test4, v_uid, v_org5,
    'From Jobless and Hopeless to Employed and Grateful',
    'Eight months ago I was unemployed, behind on rent, and genuinely scared. I had two kids counting on me and no safety net. I reached out to Neighbor Network DFW on a whim — I had heard they helped with "practical needs" and I was not sure that included what I needed, but I was out of options.

They connected me with a job skills workshop through a local nonprofit I never would have found on my own. One of the volunteers in that workshop worked in HR for a mid-size company in Dallas. She referred me. I interviewed. I got the job.

I know this is not everyone''s story. But I also know I would not be writing this without the people who showed up when I had nothing to offer in return. Thank you. You changed my family''s life.',
    'provision', false, 'approved', false, 0),

  -- Testimony 5: Mental health breakthrough (anonymous)
  (v_test5, v_uid, v_org2,
    'Therapy Saved My Life — I Mean That Literally',
    'I spent years telling myself I did not need help. That therapy was for people who were weak or broken in some way that I was not. I now know that belief was the thing that was actually hurting me.

I was in a very dark place when a friend told me about The Vine Counseling. The sliding scale fee made it possible — I could not have afforded a full-price therapist. My counselor was calm, professional, and never made me feel ashamed of anything I brought into that room.

We worked through trauma I had been carrying since childhood. Things I had never told another human being. The weight that came off was something I cannot fully describe. I sleep now. I laugh now. I want to be here.

If you have been putting off getting help because of cost or stigma — please read this and reach out. The Vine is the real deal.',
    'healing', true, 'approved', true, 4),

  -- Testimony 6: Housing provision (anonymous)
  (v_test6, v_uid, NULL,
    'I Was Three Days From the Street',
    'I do not share this easily. I was three days away from losing my apartment — a combination of medical bills and a job loss that happened too close together. I had too much "income" to qualify for most assistance programs, but not enough to actually pay my rent.

I found a resource on LifeVine for emergency rental assistance through a local ministry. I called on a Thursday. By the following Monday I had a check. My landlord agreed to accept late payment with it.

I am still catching up. But I am in my home. My kids are in their beds. That is everything.

I wanted to share this because I almost did not call. I almost convinced myself it would not work. Please do not do what I almost did. There are people who want to help. Let them.',
    'provision', true, 'approved', false, 2),

  -- Testimony 7: Sobriety and faith (anonymous, linked to Crossroads)
  (v_test7, v_uid, v_org3,
    'Faith and Recovery Found Each Other in the Same Room',
    'I grew up religious but lost my faith somewhere in my twenties — around the same time the drinking started. By the time I found Crossroads, I had written off both God and sobriety as things that were not for me.

What I did not expect was to find them both again in the same place.

Crossroads does not push faith on anyone. But it is there if you want it. The honesty in those rooms — the willingness of people to say "here is exactly where I failed and here is exactly how I got back up" — felt more like church to me than most churches I had attended.

I am two and a half years sober. I pray again. I am not the same person I was, and for the first time in my life, that is the best news I have ever received.',
    'healing', true, 'approved', false, 1),

  -- Testimony 8: Community and belonging (attributed)
  (v_test8, v_uid, v_org1,
    'I Came to Dallas Knowing No One. Hope Church Became My Family.',
    'I moved to Dallas for a job eighteen months ago. I did not know a single person in this city. I am an introvert by nature and the thought of starting over socially at thirty-four years old was genuinely terrifying.

I visited Hope Community Church one Sunday because it was close to my apartment and I needed somewhere to be. I expected to slip in and out unnoticed.

Instead, someone introduced themselves before I even got to my seat. Then another person after the service. Then I got an email follow-up the next week with information about a life group in my neighborhood.

Six months later I have friends I would call in an emergency. Real ones. People who show up with food when you are sick, who remember your birthday, who ask how the hard thing is going.

I know church is not for everyone, and I want to be careful not to oversell. But I moved here alone and I am not alone anymore. That matters more than I can say.',
    'community', false, 'approved', true, 3)

  ON CONFLICT DO NOTHING;

  -- Testimony responses (on a few testimonies)
  INSERT INTO public.testimony_responses (testimony_id, author_id, body, status)
  VALUES
    (v_test1, v_uid,
     'Thank you for sharing this. Two years is a miracle and you earned every single day of it. This gave me hope for someone I love.',
     'approved'),
    (v_test1, v_uid,
     'This is exactly what I needed to read today. God bless you.',
     'approved'),
    (v_test2, v_uid,
     'Our story is so similar. We were six weeks away. We also tried counseling as a last resort. We are still together four years later. Please do not give up.',
     'approved'),
    (v_test5, v_uid,
     'The stigma is real and you named it so well. Thank you for being brave enough to share this.',
     'approved'),
    (v_test8, v_uid,
     'This made me cry. I moved here alone too. Thank you for writing this.',
     'approved')
  ON CONFLICT DO NOTHING;

  -- Update response_count to match
  UPDATE public.testimonies SET response_count = 2 WHERE id = v_test1;
  UPDATE public.testimonies SET response_count = 3 WHERE id = v_test2;
  UPDATE public.testimonies SET response_count = 1 WHERE id = v_test3;
  UPDATE public.testimonies SET response_count = 1 WHERE id = v_test5;
  UPDATE public.testimonies SET response_count = 1 WHERE id = v_test6;
  UPDATE public.testimonies SET response_count = 1 WHERE id = v_test7;
  UPDATE public.testimonies SET response_count = 3 WHERE id = v_test8;


  -- ════════════════════════════════════════════════════════════
  -- 6. RESOURCES (12 — all categories, crisis first)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO public.resources (id, org_id, added_by, title, description, category,
    phone, email, website_url, is_crisis, is_national, city, state, country,
    status, is_featured, tags)
  VALUES

  -- CRISIS
  (v_res1, NULL, v_uid,
    '988 Suicide & Crisis Lifeline',
    'Free, confidential support for people in suicidal crisis or mental health distress. Available 24 hours a day, 7 days a week. Call or text 988. You can also chat online at 988lifeline.org. Veterans can press 1 for specialized Veterans Crisis Line support.',
    'crisis',
    '988', NULL, 'https://988lifeline.org',
    true, true, NULL, NULL, 'US',
    'approved', true,
    ARRAY['suicide', 'crisis', '24/7', 'hotline', 'veterans', 'chat']),

  (v_res2, NULL, v_uid,
    'Crisis Text Line',
    'Text HOME to 741741 to connect with a trained Crisis Counselor. Free, confidential, available 24/7. The Crisis Text Line serves anyone in any type of crisis — not just suicidal ideation. Response time is typically under 5 minutes.',
    'crisis',
    NULL, NULL, 'https://crisistextline.org',
    true, true, NULL, NULL, 'US',
    'approved', true,
    ARRAY['crisis', 'text', '24/7', 'free', 'confidential']),

  -- MENTAL HEALTH
  (v_res3, v_org2, v_uid,
    'The Vine Counseling — Sliding Scale Therapy',
    'Faith-integrated, professional counseling for individuals, couples, and families. Fees are adjusted based on income — no one is turned away due to an inability to pay. Licensed therapists specializing in trauma, grief, anxiety, depression, and marriage.',
    'mental_health',
    '(817) 555-0188', 'intake@thevinecounseling.org', 'https://thevinecounseling.org',
    false, false, 'Fort Worth', 'TX', 'US',
    'approved', true,
    ARRAY['counseling', 'therapy', 'sliding scale', 'faith-based', 'trauma', 'grief']),

  (v_res4, NULL, v_uid,
    'NAMI (National Alliance on Mental Illness) Helpline',
    'NAMI''s free helpline connects individuals and families with mental illness information, local resources, and peer-to-peer support. Not a crisis line, but an invaluable first call when you don''t know where to start. Open Monday–Friday, 10am–10pm ET.',
    'mental_health',
    '1-800-950-6264', 'helpline@nami.org', 'https://nami.org/help',
    false, true, NULL, NULL, 'US',
    'approved', false,
    ARRAY['mental illness', 'families', 'information', 'peer support', 'national']),

  -- SUBSTANCE
  (v_res5, v_org3, v_uid,
    'Crossroads Recovery Network — Free Peer Support',
    'Peer-led recovery support groups for individuals and families navigating addiction. Weekly meetings in Arlington, TX. No fees, no insurance required. All substances, all stages of recovery. Family healing groups available on Sundays.',
    'substance',
    '(682) 555-0122', 'connect@crossroadsrecovery.net', 'https://crossroadsrecovery.net',
    false, false, 'Arlington', 'TX', 'US',
    'approved', false,
    ARRAY['recovery', 'addiction', 'peer support', 'free', 'family', 'groups']),

  (v_res6, NULL, v_uid,
    'SAMHSA National Helpline',
    'Free, confidential, 24/7 treatment referral and information service for individuals and families facing mental and/or substance use disorders. Available in English and Spanish. No insurance required. Call 1-800-662-4357.',
    'substance',
    '1-800-662-4357', NULL, 'https://samhsa.gov/find-help/national-helpline',
    false, true, NULL, NULL, 'US',
    'approved', false,
    ARRAY['substance use', 'treatment', 'referral', '24/7', 'spanish', 'free']),

  -- FOOD
  (v_res7, v_org5, v_uid,
    'Neighbor Network DFW — Weekly Food Pantry',
    'Free grocery distribution every Saturday morning for Dallas-area families. No income verification, no ID required. Families receive a full week''s worth of groceries. Arrive between 8am and 10:30am at our Dallas location.',
    'food',
    '(214) 555-0109', 'volunteer@neighbornetworkdfw.org', 'https://neighbornetworkdfw.org',
    false, false, 'Dallas', 'TX', 'US',
    'approved', false,
    ARRAY['food', 'groceries', 'free', 'weekly', 'no ID required', 'Saturday']),

  -- HOUSING
  (v_res8, NULL, v_uid,
    'Texas Rent Relief Program',
    'State-administered emergency rental and utility assistance for Texas renters experiencing financial hardship. Applications are reviewed on a rolling basis. Assistance can cover past-due rent, current rent, and utility arrears. Apply online or call the helpline.',
    'housing',
    '1-833-989-7368', NULL, 'https://texasrentrelief.com',
    false, false, NULL, 'TX', 'US',
    'approved', false,
    ARRAY['rent', 'housing', 'emergency', 'utility assistance', 'Texas', 'state program']),

  -- MEDICAL
  (v_res9, v_org4, v_uid,
    'Harvest Medical Ministry — Free Walk-In Clinic',
    'Free primary care for uninsured and underinsured Dallas residents. No appointment necessary. Services include primary care, preventive screenings, prescription assistance, and women''s health. Walk-in hours: Tuesday & Thursday 9am–1pm, Saturday 9am–12pm.',
    'medical',
    '(214) 555-0176', 'clinic@harvestmedical.org', 'https://harvestmedical.org',
    false, false, 'Dallas', 'TX', 'US',
    'approved', true,
    ARRAY['medical', 'free clinic', 'walk-in', 'uninsured', 'primary care', 'prescriptions']),

  -- FINANCIAL
  (v_res10, NULL, v_uid,
    'NFCC — Nonprofit Credit & Budget Counseling',
    'The National Foundation for Credit Counseling connects people with nonprofit financial counselors for budgeting help, debt management plans, and financial crisis support. Fees are minimal or waived based on income. Phone and online appointments available.',
    'financial',
    '1-800-388-2227', NULL, 'https://nfcc.org',
    false, true, NULL, NULL, 'US',
    'approved', false,
    ARRAY['budget', 'debt', 'credit', 'financial counseling', 'nonprofit', 'affordable']),

  -- LEGAL
  (v_res11, NULL, v_uid,
    'Texas Legal Services Center',
    'Free civil legal help for low-income Texans. Services include tenant rights, family law, benefits assistance, immigration, and more. Call the helpline or apply online. Bilingual staff available. Priority given to survivors of domestic violence, seniors, and veterans.',
    'legal',
    '1-888-988-9996', NULL, 'https://tlsc.org',
    false, false, NULL, 'TX', 'US',
    'approved', false,
    ARRAY['legal aid', 'free', 'Texas', 'tenant rights', 'family law', 'immigration', 'Spanish']),

  -- SPIRITUAL
  (v_res12, v_org1, v_uid,
    'Hope Church — Free Prayer Line',
    'Not sure how to pray or where to start? Our volunteer prayer team is available by phone Monday through Saturday, 9am–7pm. No church membership required. Calls are strictly confidential. We simply want to pray with and for you.',
    'spiritual',
    '(972) 555-0141', 'hello@hopechurchdfw.org', 'https://hopechurchdfw.org',
    false, false, 'Dallas', 'TX', 'US',
    'approved', false,
    ARRAY['prayer', 'spiritual', 'free', 'phone', 'church', 'confidential'])

  ON CONFLICT DO NOTHING;


  -- ════════════════════════════════════════════════════════════
  -- 7. CONTRIBUTOR APPLICATIONS (2 pending — for admin panel)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO public.contributor_applications (
    org_name, org_type, denomination,
    city, state, website_url,
    description, usage_intent,
    contact_name, contact_email, contact_phone,
    status, submitted_by
  ) VALUES
  (
    'Grace Point Fellowship',
    'church', 'Baptist',
    'Garland', 'TX', 'https://gracepointgarland.com',
    'Grace Point Fellowship is a multi-generational Baptist church serving the Garland community since 1987. We operate a food pantry, host ESL classes for immigrant families, and run a summer youth camp for at-risk teens.',
    'We want to use LifeVine to connect our congregation with volunteer opportunities, post upcoming events, and share testimonies from our community outreach programs.',
    'Pastor Leon Harris', 'leon@gracepointgarland.com', '(972) 555-0133',
    'pending', v_uid
  ),
  (
    'Refuge Women''s Center',
    'nonprofit', NULL,
    'Irving', 'TX', 'https://refugewomenscenter.org',
    'Refuge Women''s Center provides emergency shelter, trauma counseling, legal advocacy, and transitional housing for survivors of domestic violence and trafficking. We serve over 300 women and children annually.',
    'We believe LifeVine can help us recruit trained volunteers, share survivor testimonies (with consent), and connect women in our programs with community resources they may not know exist.',
    'Sarah Morales', 'sarah@refugewomenscenter.org', '(972) 555-0157',
    'pending', v_uid
  )
  ON CONFLICT DO NOTHING;


  RAISE NOTICE 'Seed v2 complete for user: %', v_uid;
  RAISE NOTICE 'Added: extended org fields, org membership, 5 events, 8 opportunities, 8 testimonies, 12 resources, 2 contributor applications';

END $$;
