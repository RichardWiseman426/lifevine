import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * on-signup Edge Function
 * Triggered via Supabase Auth webhook on user signup.
 * Creates the corresponding profiles row.
 */
serve(async (req) => {
  const { user } = await req.json();

  if (!user?.id || !user?.email) {
    return new Response('Invalid payload', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Generate a username from the email prefix, ensuring uniqueness
  const emailPrefix = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 25);
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  const username = `${emailPrefix}_${suffix}`;

  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    username,
    display_name: emailPrefix,
  });

  if (error) {
    console.error('Failed to create profile:', error.message);
    return new Response(error.message, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
