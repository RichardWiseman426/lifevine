'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth'

export async function changeMemberRole(orgId: string, memberId: string, newRole: string) {
  await requireAccess(['super_admin'], orgId)
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('org_members') as any).update({ role: newRole }).eq('id', memberId)
  revalidatePath(`/orgs/${orgId}/members`)
}

export async function suspendMember(orgId: string, memberId: string) {
  await requireAccess(['super_admin'], orgId)
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('org_members') as any).update({ status: 'suspended' }).eq('id', memberId)
  revalidatePath(`/orgs/${orgId}/members`)
}

export async function removeMember(orgId: string, memberId: string) {
  await requireAccess(['super_admin'], orgId)
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('org_members') as any).update({ status: 'removed' }).eq('id', memberId)
  revalidatePath(`/orgs/${orgId}/members`)
}
