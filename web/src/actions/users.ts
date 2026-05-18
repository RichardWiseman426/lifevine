'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAccess, getProfile } from '@/lib/auth'

export async function updatePlatformRole(userId: string, newRole: string) {
  await requireAccess(['super_admin'])
  const supabase = await createClient()
  const actor = await getProfile()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  await db.from('platform_role_assignments')
    .update({ revoked_at: new Date().toISOString(), revoked_by: actor!.id })
    .eq('user_id', userId)
    .is('revoked_at', null)

  await db.from('platform_role_assignments').insert({
    user_id: userId,
    role: newRole,
    granted_by: actor!.id,
  })

  await db.rpc('insert_audit_log', {
    p_action: 'user.role_change',
    p_entity_type: 'profile',
    p_entity_id: userId,
    p_payload: { new_role: newRole },
  })

  revalidatePath(`/users/${userId}`)
  revalidatePath('/users')
}

export async function setBanStatus(userId: string, banned: boolean) {
  await requireAccess(['super_admin'])
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('profiles').update({ is_banned: banned }).eq('id', userId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('insert_audit_log', {
    p_action: banned ? 'user.ban' : 'user.unban',
    p_entity_type: 'profile',
    p_entity_id: userId,
    p_payload: {},
  })

  revalidatePath(`/users/${userId}`)
}
