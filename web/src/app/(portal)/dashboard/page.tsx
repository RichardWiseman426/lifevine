import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  pending_review: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-zinc-100 text-zinc-600',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const isAdmin = profile?.platform_role === 'super_admin' || profile?.platform_role === 'moderator'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [moderationResult, eventsResult, oppsResult, testimoniesResult] = await Promise.all([
    isAdmin
      ? db.from('moderation_queue').select('*', { count: 'exact', head: true })
      : Promise.resolve({ count: 0 }),
    db.from('events').select('*', { count: 'exact', head: true }).eq('status', 'approved').is('deleted_at', null),
    db.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'open').is('deleted_at', null),
    db.from('testimonies').select('*', { count: 'exact', head: true }).eq('status', 'approved').is('deleted_at', null),
  ])

  const recentModerationResult = isAdmin
    ? await db.from('moderation_queue').select('*').order('submitted_at', { ascending: true }).limit(5)
    : { data: [] }

  const recentEventsResult = await db
    .from('events')
    .select('id, title, status, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Pending Review', value: moderationResult.count ?? 0, href: '/moderation', visible: isAdmin },
    { label: 'Active Events', value: eventsResult.count ?? 0, href: '/orgs' },
    { label: 'Open Opportunities', value: oppsResult.count ?? 0, href: '/orgs' },
    { label: 'Approved Stories', value: testimoniesResult.count ?? 0, href: '/moderation?status=approved&type=testimony' },
  ].filter((s) => s.visible !== false)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1917]">Dashboard</h1>
        <p className="text-sm text-[#78716C] mt-1">Connect. Serve. Belong.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="lv-surface lv-surface-hover p-5 block">
            <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-[#78716C]">{stat.label}</p>
            <p className="text-[34px] leading-none font-bold text-[#2D6A4F] mt-3 tracking-tight">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isAdmin && (recentModerationResult.data?.length ?? 0) > 0 && (
          <Card className="border-[#ECE6DC] bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
            <CardHeader>
              <CardTitle className="text-base font-bold">Oldest Pending Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recentModerationResult.data?.map((item: any) => (
                    <TableRow key={item.content_id}>
                      <TableCell>
                        <Link href={`/moderation/${item.content_type}/${item.content_id}`} className="hover:underline">
                          <Badge variant="outline">{item.content_type}</Badge>
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">{item.preview}</TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="border-[#E5DDD4] bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Recent Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recentEventsResult.data?.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm">{event.title}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[event.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                        {event.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
