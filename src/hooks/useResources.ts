import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useResources(category: string = '') {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('resources')
      .select('id, title, description, category, phone, email, website_url, is_crisis, is_national, city, state, tags, organizations(name)')
      .eq('status', 'approved')
      .is('deleted_at', null)
      .order('is_crisis', { ascending: false })
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category as import('../types/database').ResourceCategory);

    const { data } = await query;
    setResources(data ?? []);
    setLoading(false);
  }, [category]);

  useEffect(() => { fetch(); }, [fetch]);

  return { resources, loading, refetch: fetch };
}

export function useResource(id: string) {
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('resources')
      .select('*, organizations(id, name, phone, email, website_url)')
      .eq('id', id)
      .eq('status', 'approved')
      .single()
      .then(({ data }) => {
        setResource(data);
        setLoading(false);
      });
  }, [id]);

  return { resource, loading };
}
