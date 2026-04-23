-- Migration 010: Extended contributor profile fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS mission_statement  text,
  ADD COLUMN IF NOT EXISTS service_times      text,
  ADD COLUMN IF NOT EXISTS services_offered   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS practice_details   text,
  ADD COLUMN IF NOT EXISTS social_facebook    text,
  ADD COLUMN IF NOT EXISTS social_instagram   text,
  ADD COLUMN IF NOT EXISTS social_youtube     text,
  ADD COLUMN IF NOT EXISTS social_twitter     text,
  ADD COLUMN IF NOT EXISTS pastor_name        text,
  ADD COLUMN IF NOT EXISTS pastor_title       text,
  ADD COLUMN IF NOT EXISTS pastor_bio         text,
  ADD COLUMN IF NOT EXISTS pastor_image_url   text;

COMMENT ON COLUMN public.organizations.mission_statement IS 'Short mission statement, separate from full description';
COMMENT ON COLUMN public.organizations.service_times     IS 'Free-text service/hours schedule (e.g. Sunday 9am & 11am)';
COMMENT ON COLUMN public.organizations.services_offered  IS 'Array of services offered — relevant for therapy/medical/support orgs';
COMMENT ON COLUMN public.organizations.practice_details  IS 'Detail about practice approach/philosophy — therapy/medical orgs';
COMMENT ON COLUMN public.organizations.social_facebook   IS 'Facebook page URL';
COMMENT ON COLUMN public.organizations.social_instagram  IS 'Instagram handle or URL';
COMMENT ON COLUMN public.organizations.social_youtube    IS 'YouTube channel URL';
COMMENT ON COLUMN public.organizations.social_twitter    IS 'Twitter/X handle or URL';
COMMENT ON COLUMN public.organizations.pastor_name       IS 'Lead pastor name — churches only';
COMMENT ON COLUMN public.organizations.pastor_title      IS 'Pastor title (Lead Pastor, Senior Pastor, etc.)';
COMMENT ON COLUMN public.organizations.pastor_bio        IS 'Brief pastor bio/about';
COMMENT ON COLUMN public.organizations.pastor_image_url  IS 'Pastor headshot photo URL';
