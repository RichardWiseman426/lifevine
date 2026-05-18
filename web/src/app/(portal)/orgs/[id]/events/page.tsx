import { requireAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function EventsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  await requireAccess(['super_admin'], id)

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: events }, { data: org }] = await Promise.all([
    db
      .from('events')
      .select('id, title, status, category, is_featured, created_at, event_schedules(recurrence, starts_at)')
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
        <h1 className="text-2xl font-semibold">Events</h1>
        <Link href={`/orgs/${id}/events/new`}>
          <Button>New Event</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Recurrence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(events ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-400 py-10">No events yet</TableCell>
              </TableRow>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(events ?? []).map((event: any) => {
              const schedule = Array.isArray(event.event_schedules) ? event.event_schedules[0] : event.event_schedules
              return (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell className="text-sm text-zinc-500">{event.category ?? '—'}</TableCell>
                  <TableCell>
                    {schedule?.recurrence && <Badge variant="outline">{schedule.recurrence}</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.status === 'approved' ? 'default' : 'outline'}>{event.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-400">
                    {new Date(event.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
