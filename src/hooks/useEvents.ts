import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface EventOccurrence {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  override_title: string | null;
  rsvp_count: number;
  events: {
    id: string;
    title: string;
    short_description: string | null;
    cover_image_url: string | null;
    category: string;
    is_virtual: boolean;
    city: string | null;
    state: string | null;
    organizations: {
      name: string;
      logo_url: string | null;
      slug: string;
    } | null;
  } | null;
}

export function useUpcomingEvents() {
  const [occurrences, setOccurrences] = useState<EventOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const now = new Date().toISOString();

    supabase
      .from('event_occurrences')
      .select(`
        id,starts_at,ends_at,status,override_title,rsvp_count,
        events(id,title,short_description,cover_image_url,category,is_virtual,city,state,
          organizations(name,logo_url,slug,is_partner)
        )
      `)
      .eq('status', 'scheduled')
      .gte('starts_at', now)
      .order('starts_at')
      .limit(50)
      .then(({ data, error }) => {
        if (!cancelled) {
          setOccurrences((data as unknown as EventOccurrence[]) ?? []);
          setError(error?.message ?? null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { occurrences, loading, error };
}

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<any>(null);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date().toISOString();
    Promise.all([
      supabase
        .from('events')
        .select('*, organizations(name,logo_url,slug,phone,email,website_url)')
        .eq('id', eventId)
        .single(),
      supabase
        .from('event_occurrences')
        .select('id,starts_at,ends_at,status,rsvp_count')
        .eq('event_id', eventId)
        .eq('status', 'scheduled')
        .gte('starts_at', now)
        .order('starts_at')
        .limit(10),
    ]).then(([{ data: ev }, { data: occ }]) => {
      setEvent(ev);
      setOccurrences(occ ?? []);
      setLoading(false);
    });
  }, [eventId]);

  return { event, occurrences, loading };
}
