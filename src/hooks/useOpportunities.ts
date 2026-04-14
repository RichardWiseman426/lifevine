import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Opportunity {
  id: string;
  title: string;
  short_description: string | null;
  category: string;
  tags: string[];
  is_remote: boolean;
  city: string | null;
  state: string | null;
  spots_total: number | null;
  spots_filled: number;
  commitment_description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_featured: boolean;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  org_id: string;
  organizations: {
    name: string;
    logo_url: string | null;
    slug: string;
  } | null;
}

export function useOpportunities(category = '') {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      let query = supabase
        .from('opportunities')
        .select(`
          id,title,short_description,category,tags,is_remote,city,state,
          spots_total,spots_filled,commitment_description,starts_at,ends_at,
          is_featured,status,contact_name,contact_email,contact_phone,org_id,
          organizations(name,logo_url,slug)
        `)
        .eq('status', 'open')
        .is('deleted_at', null)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.limit(50);
      if (!cancelled) {
        setOpportunities((data as unknown as Opportunity[]) ?? []);
        setError(error?.message ?? null);
        setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [category]);

  return { opportunities, loading, error };
}

export function useOpportunity(id: string) {
  const [opportunity, setOpportunity] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from('opportunities')
        .select('*, organizations(name,logo_url,slug,city,state,phone,email,website_url)')
        .eq('id', id)
        .single(),
      supabase
        .from('opportunity_steps')
        .select('*')
        .eq('opportunity_id', id)
        .order('step_order'),
    ]).then(([{ data: opp }, { data: stepsData }]) => {
      setOpportunity(opp);
      setSteps(stepsData ?? []);
      setLoading(false);
    });
  }, [id]);

  return { opportunity, steps, loading };
}
