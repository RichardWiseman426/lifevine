import { requireAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const PAGE_SIZE = 25

export default async function UsersPage(props: {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>
}) {
  await requireAccess(['super_admin'])
  const sp = await props.searchParams
  const search = sp.search ?? ''
  const roleFilter = sp.role ?? ''
  const page = parseInt(sp.page ?? '0', 10)
  const offset = page * PAGE_SIZE

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('profiles')
    .select('id, username, display_name, platform_role, is_banned, is_verified, created_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (search) query = query.ilike('display_name', `%${search}%`)
  if (roleFilter) query = query.eq('platform_role', roleFilter)

  const { data: users, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Users</h1>

      <form className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name…"
          className="border rounded-md px-3 py-1.5 text-sm flex-1 max-w-xs"
        />
        <select name="role" defaultValue={roleFilter} className="border rounded-md px-2 py-1.5 text-sm">
          <option value="">All roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="moderator">Moderator</option>
          <option value="standard">Standard</option>
        </select>
        <Button type="submit" size="sm" variant="outline">Filter</Button>
      </form>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(users ?? []).map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{u.display_name}</p>
                    <p className="text-xs text-zinc-400">@{u.username}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.platform_role === 'super_admin' ? 'default' : 'outline'}>
                    {u.platform_role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.is_banned
                    ? <Badge variant="destructive">Banned</Badge>
                    : <span className="text-xs text-green-600">Active</span>
                  }
                </TableCell>
                <TableCell className="text-xs text-zinc-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Link href={`/users/${u.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-zinc-500">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 0 && (
              <Link href={`/users?page=${page - 1}${search ? `&search=${search}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}>
                <Button variant="outline" size="sm">Previous</Button>
              </Link>
            )}
            {page < totalPages - 1 && (
              <Link href={`/users?page=${page + 1}${search ? `&search=${search}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}>
                <Button variant="outline" size="sm">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
