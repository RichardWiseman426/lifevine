import { requireAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserAdminActions } from '@/components/users/UserAdminActions'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function UserDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAccess(['super_admin'])
  const { id } = await props.params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [{ data: profile }, { data: memberships }, { data: roleHistory }] = await Promise.all([
    db.from('profiles').select('*').eq('id', id).single(),
    db
      .from('org_members')
      .select('role, status, joined_at, organizations(id, name, slug)')
      .eq('user_id', id)
      .eq('status', 'active'),
    db
      .from('platform_role_assignments')
      .select('role, granted_at, revoked_at, profiles!granted_by(display_name)')
      .eq('user_id', id)
      .order('granted_at', { ascending: false }),
  ])

  if (!profile) notFound()

  const initials = profile.display_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link href="/users" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ChevronLeft className="w-4 h-4" /> Users
      </Link>

      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">{profile.display_name}</h1>
          <p className="text-zinc-500">@{profile.username}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant={profile.platform_role === 'super_admin' ? 'default' : 'outline'}>
              {profile.platform_role}
            </Badge>
            {profile.is_banned && <Badge variant="destructive">Banned</Badge>}
            {profile.is_verified && <Badge className="bg-blue-100 text-blue-700">Verified</Badge>}
          </div>
        </div>
      </div>

      <UserAdminActions
        userId={id}
        currentRole={profile.platform_role}
        isBanned={profile.is_banned}
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Profile Info</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><span className="text-zinc-500">Email:</span> {profile.id}</p>
          <p><span className="text-zinc-500">Location:</span> {[profile.location_city, profile.location_state, profile.location_country].filter(Boolean).join(', ') || '—'}</p>
          <p><span className="text-zinc-500">Joined:</span> {new Date(profile.created_at).toLocaleDateString()}</p>
          {profile.bio && <p><span className="text-zinc-500">Bio:</span> {profile.bio}</p>}
        </CardContent>
      </Card>

      {(memberships ?? []).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Organization Memberships</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(memberships ?? []).map((m: any, i: number) => {
                  const org = m.organizations as any
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <Link href={`/orgs/${org?.id}`} className="hover:underline">{org?.name}</Link>
                      </TableCell>
                      <TableCell><Badge variant="outline">{m.role}</Badge></TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {new Date(m.joined_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(roleHistory ?? []).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Role History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Granted by</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead>Revoked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(roleHistory ?? []).map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell><Badge variant="outline">{r.role}</Badge></TableCell>
                    <TableCell className="text-sm">{(r.profiles as any)?.display_name ?? '—'}</TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {new Date(r.granted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {r.revoked_at ? new Date(r.revoked_at).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
