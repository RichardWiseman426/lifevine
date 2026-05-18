'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile, requireAccess } from '@/lib/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

export async function createOrg(formData: FormData) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string

  const { data, error } = await (supabase.from('organizations') as AnyClient)
    .insert({
      name,
      slug,
      short_description: (formData.get('short_description') as string) || null,
      description: (formData.get('description') as string) || null,
      category: (formData.get('category') as string) || 'general',
      tags: [],
      website_url: (formData.get('website_url') as string) || null,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      city: (formData.get('city') as string) || null,
      state: (formData.get('state') as string) || null,
      created_by: profile.id,
      country: 'US',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await (supabase.from('org_members') as AnyClient).insert({
    org_id: data.id,
    user_id: profile.id,
    role: 'owner',
    status: 'active',
  })

  revalidatePath('/orgs')
  redirect(`/orgs/${data.id}`)
}

export async function updateOrg(orgId: string, formData: FormData) {
  await requireAccess(['super_admin'], orgId)
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('organizations').update({
    name: formData.get('name') as string,
    short_description: (formData.get('short_description') as string) || null,
    description: (formData.get('description') as string) || null,
    website_url: (formData.get('website_url') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
  }).eq('id', orgId)

  revalidatePath(`/orgs/${orgId}`)
  redirect(`/orgs/${orgId}`)
}

export async function setOrgVerified(orgId: string, verified: boolean) {
  await requireAccess(['super_admin'])
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('organizations').update({ is_verified: verified }).eq('id', orgId)
  revalidatePath(`/orgs/${orgId}`)
}

export async function setOrgActive(orgId: string, active: boolean) {
  await requireAccess(['super_admin'])
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('organizations').update({ is_active: active }).eq('id', orgId)
  revalidatePath(`/orgs/${orgId}`)
}
