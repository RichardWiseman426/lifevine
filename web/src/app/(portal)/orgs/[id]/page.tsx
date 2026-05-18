import { requireAccess, getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { OrgAdminActions } from '@/components/orgs/OrgAdminActions'

export default async function OrgPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  await requireAccess(['super_admin'], id)

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const profile = await getProfile()

  const [orgResult, membersCount, eventsCount, oppsCount] = await Promise.all([
    db.from('organizations').select('*').eq('id', id).single(),
    db.from('org_members').select('*', { count: 'exact', head: true }).eq('org_id', id).neq('status', 'removed'),
    db.from('events').select('*', { count: 'exact', head: true }).eq('org_id', id).is('deleted_at', null),
    db.from('opportunities').select('*', { count: 'exact', head: true }).eq('org_id', id).is('deleted_at', null),
  ])

  const org = orgResult.data
  if (!org) notFound()

  const isAdmin = profile?.platform_role === 'super_admin'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{org.name}</h1>
            {org.is_verified && <Badge className="bg-blue-100 text-blue-700">Verified</Badge>}
            {!org.is_active && <Badge variant="destructive">Inactive</Badge>}
            <Badge variant="outline">{org.tier}</Badge>
          </div>
          {org.short_description && (
            <p className="text-zinc-500 mt-1">{org.short_description}</p>
          )}
        </div>
        <Link href={`/orgs/${id}/edit`}>
          <Button variant="outline">Edit</Button>
        </Link>
      </div>

      {isAdmin && (
        <OrgAdminActions orgId={id} isVerified={org.is_verified} isActive={org.is_active} />
      )}

      <div className="grid grid-cols-3 gap-4">
        <Link href={`/orgs/${id}/members`}>
          <Card className="hover:border-[#2D6A4F]/40 transition-colors cursor-pointer">
            <CardHeader className="pb-1"><CardTitle className="text-sm text-zinc-500">Members</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{membersCount.count ?? 0}</p></CardContent>
          </Card>
        </Link>
        <Link href={`/orgs/${id}/events`}>
          <Card className="hover:border-[#2D6A4F]/40 transition-colors cursor-pointer">
            <CardHeader className="pb-1"><CardTitle className="text-sm text-zinc-500">Events</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{eventsCount.count ?? 0}</p></CardContent>
          </Card>
        </Link>
        <Link href={`/orgs/${id}/opportunities`}>
          <Card className="hover:border-[#2D6A4F]/40 transition-colors cursor-pointer">
            <CardHeader className="pb-1"><CardTitle className="text-sm text-zinc-500">Opportunities</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{oppsCount.count ?? 0}</p></CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href={`/orgs/${id}/members`}><Button variant="outline" className="w-full">Members</Button></Link>
        <Link href={`/orgs/${id}/events`}><Button variant="outline" className="w-full">Events</Button></Link>
        <Link href={`/orgs/${id}/opportunities`}><Button variant="outline" className="w-full">Opportunities</Button></Link>
        <Link href={`/orgs/${id}/resources`}><Button variant="outline" className="w-full">Resources</Button></Link>
      </div>

      {org.description && (
        <Card>
          <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{org.description}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
