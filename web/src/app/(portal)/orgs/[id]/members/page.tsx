import { requireAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MemberActions } from '@/components/orgs/MemberActions'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function MembersPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  await requireAccess(['super_admin'], id)

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: members } = await db
    .from('org_members')
    .select('id, role, status, joined_at, profiles(id, display_name, username, avatar_url)')
    .eq('org_id', id)
    .neq('status', 'removed')
    .order('joined_at')

  const { data: org } = await db.from('organizations').select('name').eq('id', id).single()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Link href={`/orgs/${id}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ChevronLeft className="w-4 h-4" /> {org?.name ?? 'Organization'}
      </Link>
      <h1 className="text-2xl font-semibold">Members</h1>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(members ?? []).map((m: any) => {
              const p = m.profiles as any
              const initials = (p?.display_name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <TableRow key={m.id}>
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
                  <TableCell><Badge variant="outline">{m.role}</Badge></TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {m.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-400">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <MemberActions orgId={id} memberId={m.id} currentRole={m.role} currentStatus={m.status} />
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
