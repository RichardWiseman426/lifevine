-- Migration 009: Add contact info, denomination, and gallery to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS contact_name  text,
  ADD COLUMN IF NOT EXISTS contact_title text,
  ADD COLUMN IF NOT EXISTS denomination  text,
  ADD COLUMN IF NOT EXISTS gallery_urls  text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.organizations.contact_name  IS 'Primary contact person name (e.g. pastor, director)';
COMMENT ON COLUMN public.organizations.contact_title IS 'Title or role of primary contact (e.g. Lead Pastor, Executive Director)';
COMMENT ON COLUMN public.organizations.denomination  IS 'Denominational affiliation — only relevant for churches';
COMMENT ON COLUMN public.organizations.gallery_urls  IS 'Up to 6 photo URLs showcasing the organization';
