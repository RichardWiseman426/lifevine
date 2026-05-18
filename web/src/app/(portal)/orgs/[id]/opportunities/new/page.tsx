import { requireAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createOpportunity } from '@/actions/opportunities'
import { OpportunityForm } from '@/components/opportunities/OpportunityForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewOpportunityPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  await requireAccess(['super_admin'], id)

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any).from('organizations').select('name').eq('id', id).single()
  const action = createOpportunity.bind(null, id)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Link href={`/orgs/${id}/opportunities`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ChevronLeft className="w-4 h-4" /> {org?.name} Opportunities
      </Link>
      <h1 className="text-2xl font-semibold">New Opportunity</h1>
      <OpportunityForm action={action} />
    </div>
  )
}
