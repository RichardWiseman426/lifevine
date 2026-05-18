import { requireAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ResponseActions } from '@/components/opportunities/ResponseActions'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ResponsesPage(props: {
  params: Promise<{ id: string; oppId: string }>
}) {
  const { id, oppId } = await props.params
  await requireAccess(['super_admin'], id)

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: responses }, { data: opp }] = await Promise.all([
    db
      .from('opportunity_responses')
      .select('id, status, message, availability_notes, responded_at, profiles(display_name, avatar_url, username)')
      .eq('opportunity_id', oppId)
      .order('responded_at'),
    db.from('opportunities').select('title').eq('id', oppId).single(),
  ])

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    withdrawn: 'bg-zinc-100 text-zinc-500',
    completed: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Link href={`/orgs/${id}/opportunities`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ChevronLeft className="w-4 h-4" /> Opportunities
      </Link>
      <h1 className="text-2xl font-semibold">Responses — {opp?.title}</h1>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(responses ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-400 py-10">No responses yet</TableCell>
              </TableRow>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(responses ?? []).map((r: any) => {
              const p = r.profiles as any
              const initials = (p?.display_name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={p?.avatar_url} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{p?.display_name}</p>
                        <p className="text-xs text-zinc-400">@{p?.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs text-sm truncate">{r.message ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'bg-zinc-100 text-zinc-500'}`}>
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-400">
                    {new Date(r.responded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {r.status === 'pending' && (
                      <ResponseActions responseId={r.id} orgId={id} />
                    )}
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
