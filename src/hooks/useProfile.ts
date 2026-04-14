import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';

export function useMyOrgs() {
  const { user } = useAuthStore();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setOrgs([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('org_members')
      .select('role, status, organizations(id, name, slug, category, city, state, is_verified)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });
    setOrgs(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { orgs, loading, refetch: fetch };
}

export function useUpdateProfile() {
  const { user, setProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);

  async function updateProfile(fields: { display_name?: string; bio?: string; username?: string }) {
    if (!user) return { error: 'Not signed in' };
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    setSaving(false);
    if (!error && data) setProfile(data);
    return { error: error?.message ?? null };
  }

  return { updateProfile, saving };
}
