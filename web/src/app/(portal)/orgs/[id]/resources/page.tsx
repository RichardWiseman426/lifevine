import { requireAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createResource } from '@/actions/resources'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ResourceForm } from '@/components/resources/ResourceForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ResourcesPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  await requireAccess(['super_admin'], id)

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: resources }, { data: org }] = await Promise.all([
    db
      .from('resources')
      .select('id, title, category, status, is_crisis, city, state, created_at')
      .eq('org_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    db.from('organizations').select('name').eq('id', id).single(),
  ])

  const action = createResource.bind(null, id)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link href={`/orgs/${id}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ChevronLeft className="w-4 h-4" /> {org?.name ?? 'Organization'}
      </Link>
      <h1 className="text-2xl font-semibold">Resources</h1>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(resources ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-400 py-10">No resources yet</TableCell>
              </TableRow>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(resources ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {r.title}
                  {r.is_crisis && <Badge className="ml-2 bg-red-100 text-red-700 text-xs">Crisis</Badge>}
                </TableCell>
                <TableCell className="text-sm text-zinc-500">{r.category}</TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {[r.city, r.state].filter(Boolean).join(', ') || 'National'}
                </TableCell>
                <TableCell>
                  <Badge variant={r.status === 'approved' ? 'default' : 'outline'}>{r.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Add Resource</h2>
        <ResourceForm action={action} />
      </div>
    </div>
  )
}
