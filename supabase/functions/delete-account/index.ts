import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY          = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // ── Verify the calling user via their JWT ─────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = user.id;

  // ── Admin client (service role) ───────────────────────────────
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // ── Step 1: Anonymize the profile row (preserve referential
  //   integrity but remove all PII) ───────────────────────────
  await admin.from('profiles').update({
    display_name:   'Deleted User',
    username:       `deleted_${userId.slice(0, 8)}`,
    first_name:     null,
    last_name:      null,
    bio:            null,
    avatar_url:     null,
    location_city:  null,
    location_state: null,
    location_country: null,
    deleted_at:     new Date().toISOString(),
  }).eq('id', userId);

  // ── Step 2: Anonymize testimony authorship (keep approved
  //   testimonies visible but strip identity) ─────────────────
  await admin.from('testimonies')
    .update({ is_anonymous: true })
    .eq('author_id', userId);

  // ── Step 3: Remove from conversations (leave messages as-is,
  //   profile is already anonymized above) ────────────────────
  await admin.from('conversation_participants')
    .delete()
    .eq('user_id', userId);

  // ── Step 4: Cancel upcoming RSVPs ──────────────────────────
  await admin.from('event_rsvps')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('cancelled_at', null);

  // ── Step 5: Delete the Supabase Auth user ──────────────────
  //   This is irreversible and must be the final step.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('delete-account: auth delete failed', deleteError.message);
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
