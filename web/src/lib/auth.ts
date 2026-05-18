import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type PlatformRole = 'super_admin' | 'moderator' | 'standard'

export type Profile = {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  phone: string | null
  platform_role: PlatformRole
  is_verified: boolean
  is_banned: boolean
  location_city: string | null
  location_state: string | null
  location_country: string
  timezone: string
  onboarding_complete: boolean
  last_active_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return (data ?? null) as Profile | null
}

export async function requireAccess(
  allowedRoles: PlatformRole[],
  orgId?: string
): Promise<void> {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  if (allowedRoles.includes(profile!.platform_role)) return

  if (orgId) {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', profile!.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])
      .maybeSingle()
    if (data) return
  }

  redirect('/access-denied')
}
