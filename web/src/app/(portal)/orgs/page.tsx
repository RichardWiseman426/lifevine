import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, CheckCircle2, Building2 } from 'lucide-react'

export default async function OrgsPage() {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const isAdmin = profile.platform_role === 'super_admin' || profile.platform_role === 'moderator'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orgs: any[] = []

  if (isAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('organizations')
      .select('id, name, slug, short_description, category, is_verified, is_active, tier, city, state')
      .is('deleted_at', null)
      .order('name')
    orgs = data ?? []
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('org_members')
      .select('role, organizations(id, name, slug, short_description, category, is_verified, is_active, tier, city, state)')
      .eq('user_id', profile.id)
      .eq('status', 'active')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orgs = (data ?? []).map((m: any) => m.organizations).filter(Boolean)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-7">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1C1917]">Organizations</h1>
          <p className="text-sm text-[#78716C] mt-1">{orgs.length} {orgs.length === 1 ? 'organization' : 'organizations'}</p>
        </div>
        <Link
          href="/orgs/new"
          className="inline-flex items-center gap-1.5 bg-[#2D6A4F] hover:bg-[#245840] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Organization
        </Link>
      </div>

      {orgs.length === 0 ? (
        <div className="lv-surface p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6 text-[#2D6A4F]" />
          </div>
          <p className="text-[#1C1917] font-semibold">No organizations yet</p>
          <p className="text-sm text-[#78716C] mt-1">Create your first one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <Link key={org.id} href={`/orgs/${org.id}`} className="lv-surface lv-surface-hover p-5 block">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#2D6A4F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-semibold text-[#1C1917] truncate">{org.name}</h3>
                    {org.is_verified && <CheckCircle2 className="w-4 h-4 text-[#2563EB] flex-shrink-0" />}
                  </div>
                  {org.short_description && (
                    <p className="text-sm text-[#78716C] mt-1 line-clamp-2">{org.short_description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {org.category && (
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#B8864E] bg-[#FDF3E3] px-2 py-0.5 rounded-full">
                        {org.category}
                      </span>
                    )}
                    {org.city && (
                      <span className="text-xs text-[#A8A29E]">{[org.city, org.state].filter(Boolean).join(', ')}</span>
                    )}
                    {!org.is_active && (
                      <span className="text-[11px] uppercase tracking-wider font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
