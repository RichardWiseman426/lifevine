import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * expand-recurrences Edge Function
 * Triggered nightly by pg_cron.
 * Reads event_schedules with recurrence != 'none' and materializes
 * event_occurrences for the next 60 days.
 */
serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const horizonDays = 60;
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + horizonDays);

  // Fetch all non-expired recurring schedules
  const { data: schedules, error } = await supabase
    .from('event_schedules')
    .select('*')
    .neq('recurrence', 'none')
    .or(`recurrence_end_date.is.null,recurrence_end_date.gte.${new Date().toISOString().split('T')[0]}`);

  if (error) {
    console.error('Failed to fetch schedules:', error.message);
    return new Response(error.message, { status: 500 });
  }

  let created = 0;

  for (const schedule of schedules ?? []) {
    const occurrences = generateOccurrences(schedule, horizon);

    for (const occ of occurrences) {
      // upsert — safe to run nightly (UNIQUE on schedule_id, starts_at)
      const { error: upsertError } = await supabase
        .from('event_occurrences')
        .upsert({
          event_id: schedule.event_id,
          schedule_id: schedule.id,
          starts_at: occ.starts_at,
          ends_at: occ.ends_at,
          status: 'scheduled',
        }, { onConflict: 'schedule_id,starts_at', ignoreDuplicates: true });

      if (!upsertError) created++;
    }
  }

  return new Response(JSON.stringify({ ok: true, created }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

interface Schedule {
  id: string;
  event_id: string;
  recurrence: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  recurrence_end_date: string | null;
  max_occurrences: number | null;
}

interface Occurrence {
  starts_at: string;
  ends_at: string;
}

function generateOccurrences(schedule: Schedule, horizon: Date): Occurrence[] {
  const results: Occurrence[] = [];
  const start = new Date(schedule.starts_at);
  const durationMs = schedule.duration_minutes * 60 * 1000;
  const endDate = schedule.recurrence_end_date
    ? new Date(schedule.recurrence_end_date)
    : horizon;
  const limit = schedule.max_occurrences ?? 1000;
  const now = new Date();

  let cursor = new Date(start);
  let count = 0;

  while (cursor <= horizon && cursor <= endDate && count < limit) {
    if (cursor >= now) {
      const occEnd = new Date(cursor.getTime() + durationMs);
      results.push({
        starts_at: cursor.toISOString(),
        ends_at: occEnd.toISOString(),
      });
      count++;
    }

    // Advance cursor based on recurrence type
    switch (schedule.recurrence) {
      case 'daily':     cursor.setDate(cursor.getDate() + 1); break;
      case 'weekly':    cursor.setDate(cursor.getDate() + 7); break;
      case 'biweekly':  cursor.setDate(cursor.getDate() + 14); break;
      case 'monthly':   cursor.setMonth(cursor.getMonth() + 1); break;
      default:          cursor = new Date(horizon.getTime() + 1); // stop
    }
  }

  return results;
}
