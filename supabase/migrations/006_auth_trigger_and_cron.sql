-- ============================================================
-- Migration 006: Auth Trigger + Nightly Cron Schedule
-- ============================================================

-- ============================================================
-- 1. PROFILE AUTO-CREATION TRIGGER
-- Fires after INSERT on auth.users.
-- Creates a corresponding profiles row automatically so every
-- signed-up user has a profile without any Edge Function call.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  email_prefix text;
  new_username  text;
BEGIN
  email_prefix := split_part(NEW.email, '@', 1);
  email_prefix := regexp_replace(email_prefix, '[^a-zA-Z0-9_]', '_', 'g');
  email_prefix := left(email_prefix, 25);
  new_username  := email_prefix || '_' || floor(random() * 9000 + 1000)::text;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, new_username, email_prefix)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. EXTENSIONS FOR SCHEDULING
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 3. NIGHTLY RECURRENCE EXPANSION
-- Calls the expand-recurrences Edge Function every night at
-- 2am UTC to materialize event_occurrences for the next 60 days.
-- NOTE: Replace the Bearer token if the service role key changes.
-- ============================================================
SELECT cron.schedule(
  'expand-recurrences-nightly',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ikiwhhuxodegpwuuqblz.supabase.co/functions/v1/expand-recurrences',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrd2hodXhvZGVncHd1dXFibHoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzc2MDg5OTU1LCJleHAiOjIwOTE2NjU5NTV9.ScLakBvC2a0w6ED73SEMeHBGt9C3hFDmwgQ-mx-JeE8"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
