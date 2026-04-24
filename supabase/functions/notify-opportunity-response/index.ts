import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * notify-opportunity-response Edge Function
 *
 * Triggered via Supabase DB Webhook on INSERT into opportunity_responses.
 * Notifies all owner/admin members of the org that owns the opportunity:
 *   1. Expo push notification
 *   2. In-app notification (notifications table)
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const payload = await req.json();
    const response = payload.record;
    if (!response?.opportunity_id) {
      return new Response('No record in payload', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get the opportunity title + org_id
    const { data: opp } = await supabase
      .from('opportunities')
      .select('title, org_id')
      .eq('id', response.opportunity_id)
      .single();

    if (!opp) return new Response('Opportunity not found', { status: 200 });

    // Get the responder's name
    const { data: responder } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', response.user_id)
      .single();

    const responderName = responder?.display_name ?? responder?.username ?? 'Someone';

    // Get all owner/admin members of the org with push tokens
    const { data: admins } = await supabase
      .from('org_members')
      .select('user_id, profiles(display_name, expo_push_token)')
      .eq('org_id', opp.org_id)
      .in('role', ['owner', 'admin'])
      .eq('status', 'active');

    if (!admins?.length) return new Response('No admins', { status: 200 });

    const notifTitle = 'New Volunteer Response';
    const notifBody  = `${responderName} wants to help with "${opp.title}"`;

    // 1. Push notifications
    const pushMessages = admins
      .filter(a => (a.profiles as any)?.expo_push_token?.startsWith('ExponentPushToken'))
      .map(a => ({
        to:    (a.profiles as any).expo_push_token,
        title: notifTitle,
        body:  notifBody,
        sound: 'default',
        badge: 1,
        data:  { screen: 'opportunity-responses', id: response.opportunity_id },
      }));

    if (pushMessages.length > 0) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(pushMessages),
      });
    }

    // 2. In-app notifications
    const notifications = admins.map(a => ({
      user_id:     a.user_id,
      type:        'opportunity_response',
      title:       notifTitle,
      body:        notifBody,
      entity_type: 'opportunity',
      entity_id:   response.opportunity_id,
      channel:     'in_app',
      is_read:     false,
      sent_at:     new Date().toISOString(),
    }));

    await supabase.from('notifications').insert(notifications);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
