import { requireAccess } from '@/lib/auth'
import { createOrg } from '@/actions/orgs'
import { OrgForm } from '@/components/orgs/OrgForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewOrgPage() {
  await requireAccess(['super_admin', 'moderator', 'standard'])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Link href="/orgs" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ChevronLeft className="w-4 h-4" /> Back to Organizations
      </Link>
      <h1 className="text-2xl font-semibold">Create Organization</h1>
      <OrgForm action={createOrg} submitLabel="Create Organization" />
    </div>
  )
}
