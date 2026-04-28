-- Migration 019: Community Requests
-- Tracks user-submitted requests for LifeVine support in a city/state
-- Used by the admin panel to see demand geography and prioritize outreach.

CREATE TABLE IF NOT EXISTS public.community_requests (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  city          text NOT NULL,
  state         text NOT NULL,
  note          text,                                          -- optional message from requester
  outreached_at timestamptz,                                  -- set when admin marks outreached
  outreached_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now() NOT NULL
);

-- Index for grouping by location
CREATE INDEX community_requests_location_idx
  ON public.community_requests (state, city);

-- Index for sorting by time
CREATE INDEX community_requests_created_idx
  ON public.community_requests (created_at DESC);

-- RLS
ALTER TABLE public.community_requests ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert a request for their own city
CREATE POLICY "users_insert_own_request"
  ON public.community_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins and moderators can read all requests
CREATE POLICY "admins_read_requests"
  ON public.community_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND platform_role IN ('super_admin', 'moderator')
    )
  );

-- Admins can update (mark as outreached)
CREATE POLICY "admins_update_requests"
  ON public.community_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND platform_role IN ('super_admin', 'moderator')
    )
  );
