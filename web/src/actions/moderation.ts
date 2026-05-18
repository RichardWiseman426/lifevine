'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'

const TABLE_MAP: Record<string, string> = {
  testimony: 'testimonies',
  testimony_response: 'testimony_responses',
  resource: 'resources',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function auditLog(supabase: any, action: string, type: string, id: string, payload: object) {
  await supabase.rpc('insert_audit_log', {
    p_action: action,
    p_entity_type: type,
    p_entity_id: id,
    p_payload: payload,
  })
}

export async function approveContent(type: string, id: string) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile) return redirect('/login')

  const table = TABLE_MAP[type]
  if (!table) throw new Error('Unknown content type')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  await db.from(table).update({
    status: 'approved',
    moderated_by: profile.id,
    moderated_at: new Date().toISOString(),
  }).eq('id', id)

  await auditLog(db, `${type}.approve`, type, id, {})

  revalidatePath('/moderation')
  return redirect('/moderation')
}

export async function resetContent(type: string, id: string) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile) return redirect('/login')

  const table = TABLE_MAP[type]
  if (!table) throw new Error('Unknown content type')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  await db.from(table).update({
    status: 'pending_review',
    moderated_by: null,
    moderated_at: null,
    rejection_reason: null,
  }).eq('id', id)

  await auditLog(db, `${type}.reset`, type, id, {})

  revalidatePath('/moderation')
  return redirect(`/moderation/${type}/${id}`)
}

export async function rejectContent(type: string, id: string, reason: string) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile) return redirect('/login')

  const table = TABLE_MAP[type]
  if (!table) throw new Error('Unknown content type')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  await db.from(table).update({
    status: 'rejected',
    moderated_by: profile.id,
    moderated_at: new Date().toISOString(),
    rejection_reason: reason,
  }).eq('id', id)

  await auditLog(db, `${type}.reject`, type, id, { reason })

  revalidatePath('/moderation')
  return redirect('/moderation')
}
