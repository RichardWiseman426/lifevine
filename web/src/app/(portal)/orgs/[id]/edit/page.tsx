import { requireAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { updateOrg } from '@/actions/orgs'
import { OrgForm } from '@/components/orgs/OrgForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function EditOrgPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  await requireAccess(['super_admin'], id)

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any).from('organizations').select('*').eq('id', id).single()
  if (!org) notFound()

  const action = updateOrg.bind(null, id)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Link href={`/orgs/${id}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ChevronLeft className="w-4 h-4" /> Back to {org.name}
      </Link>
      <h1 className="text-2xl font-semibold">Edit Organization</h1>
      <OrgForm action={action} defaultValues={org as any} submitLabel="Save Changes" />
    </div>
  )
}
