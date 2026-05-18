'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAccess, getProfile } from '@/lib/auth'

export async function createResource(orgId: string, formData: FormData) {
  await requireAccess(['super_admin'], orgId)
  const supabase = await createClient()
  const profile = await getProfile()

  const isSuperAdmin = profile?.platform_role === 'super_admin'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('resources').insert({
    org_id: orgId,
    added_by: profile!.id,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    category: formData.get('category') as any,
    tags: [],
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    website_url: (formData.get('website_url') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    is_crisis: formData.get('is_crisis') === 'on',
    is_national: formData.get('is_national') === 'on',
    status: (isSuperAdmin ? 'approved' : 'pending_review') as any,
  })

  revalidatePath(`/orgs/${orgId}/resources`)
  redirect(`/orgs/${orgId}/resources`)
}
