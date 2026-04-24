import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * notify-new-application Edge Function
 *
 * Triggered via Supabase DB Webhook on INSERT into contributor_applications.
 * For each super_admin / moderator:
 *   1. Sends an Expo push notification (if they have a push token)
 *   2. Inserts an in-app notification into the notifications table
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const payload = await req.json();

    // Supabase DB webhooks send { type, table, record, old_record }
    const application = payload.record;
    if (!application) {
      return new Response('No record in payload', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all super_admins and moderators
    const { data: admins, error: adminsErr } = await supabase
      .from('profiles')
      .select('id, display_name, expo_push_token')
      .in('platform_role', ['super_admin', 'moderator'])
      .is('deleted_at', null);

    if (adminsErr || !admins?.length) {
      console.error('No admins found or error:', adminsErr?.message);
      return new Response('No admins', { status: 200 });
    }

    const orgName    = application.org_name    ?? 'Unknown Org';
    const orgType    = application.org_type    ?? 'organization';
    const contactName = application.contact_name ?? '';
    const notifTitle = 'New Contributor Application';
    const notifBody  = `${orgName} (${orgType})${contactName ? ` — ${contactName}` : ''} is waiting for review.`;

    // 1. Send Expo push notifications
    const pushTokens = admins
      .filter(a => a.expo_push_token?.startsWith('ExponentPushToken'))
      .map(a => ({
        to: a.expo_push_token,
        title: notifTitle,
        body: notifBody,
        sound: 'default',
        badge: 1,
        data: { screen: 'admin', type: 'contributor_application' },
      }));

    if (pushTokens.length > 0) {
      const pushRes = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(pushTokens),
      });
      const pushData = await pushRes.json();
      console.log('Push result:', JSON.stringify(pushData));
    }

    // 2. Insert in-app notifications for all admins
    const notifications = admins.map(admin => ({
      user_id:     admin.id,
      type:        'contributor_application',
      title:       notifTitle,
      body:        notifBody,
      entity_type: 'contributor_application',
      entity_id:   application.id ?? null,
      channel:     'in_app',
      is_read:     false,
      sent_at:     new Date().toISOString(),
    }));

    const { error: notifErr } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifErr) {
      console.error('Failed to insert notifications:', notifErr.message);
    }

    return new Response(JSON.stringify({ ok: true, admins: admins.length }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
