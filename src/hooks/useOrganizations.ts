import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  category: string;
  tags: string[];
  city: string | null;
  state: string | null;
  country: string;
  is_verified: boolean;
  is_featured: boolean;
  is_partner: boolean;
  tier: string;
}

export function useOrganizations(search = '', category = '') {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      let query = supabase
        .from('organizations')
        .select('id,slug,name,short_description,logo_url,banner_url,category,tags,city,state,country,is_verified,is_featured,is_partner,tier')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('is_featured', { ascending: false })
        .order('name');

      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.limit(50);
      if (!cancelled) {
        setOrgs((data as unknown as Organization[]) ?? []);
        setError(error?.message ?? null);
        setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [search, category]);

  return { orgs, loading, error };
}

export function useOrganization(id: string) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setOrg(data as unknown as Organization);
        setLoading(false);
      });
  }, [id]);

  return { org, loading };
}
