'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAccess, getProfile } from '@/lib/auth'

export async function createOpportunity(orgId: string, formData: FormData) {
  await requireAccess(['super_admin'], orgId)
  const supabase = await createClient()
  const profile = await getProfile()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('opportunities') as any).insert({
    org_id: orgId,
    created_by: profile!.id,
    title: formData.get('title') as string,
    short_description: (formData.get('short_description') as string) || null,
    description: (formData.get('description') as string) || null,
    category: (formData.get('category') as string) || 'general',
    tags: [],
    is_recurring: false,
    spots_total: formData.get('spots_total') ? parseInt(formData.get('spots_total') as string) : null,
    is_remote: formData.get('is_remote') === 'on',
    status: 'open' as const,
  })

  revalidatePath(`/orgs/${orgId}/opportunities`)
  redirect(`/orgs/${orgId}/opportunities`)
}

export async function updateResponse(responseId: string, orgId: string, newStatus: string, notes?: string) {
  await requireAccess(['super_admin'], orgId)
  const supabase = await createClient()
  const profile = await getProfile()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('opportunity_responses') as any).update({
    status: newStatus,
    reviewed_at: new Date().toISOString(),
    reviewed_by: profile!.id,
    reviewer_notes: notes ?? null,
  }).eq('id', responseId)

  revalidatePath(`/orgs/${orgId}/opportunities`)
}
