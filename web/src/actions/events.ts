'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth'

export async function createEvent(orgId: string, formData: FormData) {
  await requireAccess(['super_admin'], orgId)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    org_id: orgId,
    created_by: user!.id,
    title: formData.get('title') as string,
    short_description: (formData.get('short_description') as string) || null,
    description: (formData.get('description') as string) || null,
    category: (formData.get('category') as string) || 'general',
    tags: [] as string[],
    is_virtual: formData.get('is_virtual') === 'on',
    virtual_url: (formData.get('virtual_url') as string) || null,
    city: (formData.get('address_city') as string) || null,
    state: (formData.get('address_state') as string) || null,
    max_attendees: formData.get('max_attendees') ? parseInt(formData.get('max_attendees') as string) : null,
    is_public: true,
    status: 'approved' as const,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: event, error } = await (supabase.from('events') as any)
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  const recurrence = formData.get('recurrence') as string || 'none'
  const startsAt = formData.get('starts_at') as string
  const endsAt = formData.get('ends_at') as string

  if (startsAt) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('event_schedules') as any).insert({
      event_id: event.id,
      recurrence,
      starts_at: startsAt,
      ends_at: endsAt || null,
      timezone: 'America/Chicago',
    })
  }

  revalidatePath(`/orgs/${orgId}/events`)
  redirect(`/orgs/${orgId}/events`)
}
