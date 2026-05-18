import { requireAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function OpportunitiesPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  await requireAccess(['super_admin'], id)

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: opps }, { data: org }] = await Promise.all([
    db
      .from('opportunities')
      .select('id, title, status, category, spots_total, spots_filled, created_at')
      .eq('org_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    db.from('organizations').select('name').eq('id', id).single(),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Link href={`/orgs/${id}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ChevronLeft className="w-4 h-4" /> {org?.name ?? 'Organization'}
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Opportunities</h1>
        <Link href={`/orgs/${id}/opportunities/new`}>
          <Button>New Opportunity</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Spots</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(opps ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-400 py-10">No opportunities yet</TableCell>
              </TableRow>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(opps ?? []).map((opp: any) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium">{opp.title}</TableCell>
                <TableCell className="text-sm text-zinc-500">{opp.category ?? '—'}</TableCell>
                <TableCell className="text-sm">
                  {opp.spots_total ? `${opp.spots_filled ?? 0}/${opp.spots_total}` : '∞'}
                </TableCell>
                <TableCell>
                  <Badge variant={opp.status === 'open' ? 'default' : 'outline'}>{opp.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/orgs/${id}/opportunities/${opp.id}/responses`}>
                    <Button size="sm" variant="outline">Responses</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
