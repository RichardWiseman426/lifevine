import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Testimony {
  id: string;
  title: string;
  body: string;
  category: string;
  is_anonymous: boolean;
  is_featured: boolean;
  response_count: number;
  created_at: string;
  author_id: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  organizations: {
    name: string;
    slug: string;
  } | null;
}

export function useTestimonies(category = '') {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      let query = supabase
        .from('testimonies')
        .select(`
          id,title,body,category,is_anonymous,is_featured,response_count,created_at,author_id,
          profiles(display_name,avatar_url),
          organizations(name,slug)
        `)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.limit(50);
      if (!cancelled) {
        setTestimonies((data as unknown as Testimony[]) ?? []);
        setError(error?.message ?? null);
        setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [category]);

  return { testimonies, loading, error };
}

export function useTestimony(id: string) {
  const [testimony, setTestimony] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from('testimonies')
        .select('*, profiles(display_name,avatar_url), organizations(name,slug)')
        .eq('id', id)
        .single(),
      supabase
        .from('testimony_responses')
        .select('*, profiles(display_name,avatar_url)')
        .eq('testimony_id', id)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at'),
    ]).then(([{ data: t }, { data: r }]) => {
      setTestimony(t);
      setResponses(r ?? []);
      setLoading(false);
    });
  }, [id]);

  return { testimony, responses, loading };
}
