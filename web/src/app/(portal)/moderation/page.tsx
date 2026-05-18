import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, MessageSquare, BookOpen, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 20

const TYPE_LABELS: Record<string, string> = {
  testimony: 'Story',
  testimony_response: 'Reply',
  resource: 'Resource',
}

const STATUS_FILTERS = [
  { value: 'pending_review', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const

const TYPE_TO_TABLE: Record<string, { table: string; idField: string; previewField: string; dateField: string; authorField: string }> = {
  testimony: { table: 'testimonies', idField: 'id', previewField: 'title', dateField: 'created_at', authorField: 'author_id' },
  testimony_response: { table: 'testimony_responses', idField: 'id', previewField: 'body', dateField: 'created_at', authorField: 'author_id' },
  resource: { table: 'resources', idField: 'id', previewField: 'title', dateField: 'created_at', authorField: 'added_by' },
}

export default async function ModerationPage(props: {
  searchParams: Promise<{ type?: string; status?: string; page?: string }>
}) {
  await requireAccess(['super_admin', 'moderator'])
  const sp = await props.searchParams
  const typeFilter = sp.type ?? 'testimony'
  const statusFilter = sp.status ?? 'pending_review'
  const page = parseInt(sp.page ?? '0', 10)
  const offset = page * PAGE_SIZE

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  type Item = {
    content_id: string
    content_type: string
    preview: string
    submitted_at: string
    submitted_by: string
    status: string
  }

  let items: Item[] = []
  let count = 0

  if (statusFilter === 'pending_review' && !sp.type) {
    // Use the moderation_queue view — covers all types in one query
    let query = db
      .from('moderation_queue')
      .select('*', { count: 'exact' })
      .order('submitted_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
    const { data, count: c } = await query
    items = (data ?? []) as Item[]
    count = c ?? 0
  } else {
    const conf = TYPE_TO_TABLE[typeFilter]
    if (conf) {
      const { data, count: c } = await db
        .from(conf.table)
        .select(`${conf.idField}, ${conf.previewField}, ${conf.dateField}, ${conf.authorField}, status`, { count: 'exact' })
        .eq('status', statusFilter)
        .is('deleted_at', null)
        .order(conf.dateField, { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items = (data ?? []).map((row: any) => ({
        content_id: row[conf.idField],
        content_type: typeFilter,
        preview: row[conf.previewField] ?? '',
        submitted_at: row[conf.dateField],
        submitted_by: row[conf.authorField],
        status: row.status,
      }))
      count = c ?? 0
    }
  }

  const submitterIds = [...new Set(items.map((i) => i.submitted_by).filter(Boolean))]
  const profilesResult = submitterIds.length
    ? await db.from('profiles').select('id, display_name').in('id', submitterIds)
    : { data: [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileMap = Object.fromEntries((profilesResult.data ?? []).map((p: any) => [p.id, p.display_name]))

  const totalPages = Math.ceil(count / PAGE_SIZE)

  function buildHref(overrides: Partial<{ type: string; status: string; page: number }> = {}) {
    const params = new URLSearchParams()
    const t = overrides.type ?? typeFilter
    const s = overrides.status ?? statusFilter
    const p = overrides.page ?? 0
    if (t) params.set('type', t)
    if (s) params.set('status', s)
    if (p > 0) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/moderation?${qs}` : '/moderation'
  }

  const STATUS_BADGE: Record<string, string> = {
    pending_review: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1917]">Moderation</h1>
        <p className="text-sm text-[#78716C] mt-1">Review submitted, approved, or rejected content.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1.5 bg-white border border-[#E5DDD4] rounded-xl p-1">
          {STATUS_FILTERS.map((s) => (
            <Link key={s.value} href={buildHref({ status: s.value, page: 0 })}>
              <button
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  statusFilter === s.value
                    ? 'bg-[#2D6A4F] text-white'
                    : 'text-[#57534E] hover:bg-[#FAF7F2]'
                }`}
              >
                {s.label}
              </button>
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          {['testimony', 'testimony_response', 'resource'].map((t) => (
            <Link key={t} href={buildHref({ type: t, page: 0 })}>
              <Button variant={typeFilter === t ? 'default' : 'outline'} size="sm" className={typeFilter === t ? 'bg-[#2D6A4F] hover:bg-[#245840]' : ''}>
                {TYPE_LABELS[t]}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="lv-surface overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-[#A8A29E]">
            No {STATUS_FILTERS.find((s) => s.value === statusFilter)?.label.toLowerCase()} {TYPE_LABELS[typeFilter]?.toLowerCase() ?? ''} items
          </div>
        ) : (
          <ul className="divide-y divide-[#ECE6DC]">
            {items.map((item) => {
              const TypeIcon = item.content_type === 'testimony' ? FileText : item.content_type === 'testimony_response' ? MessageSquare : BookOpen
              return (
                <li key={`${item.content_type}-${item.content_id}`}>
                  <Link
                    href={`/moderation/${item.content_type}/${item.content_id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAF7F2] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="w-5 h-5 text-[#2D6A4F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1C1917] truncate">{item.preview || `Untitled ${TYPE_LABELS[item.content_type]}`}</p>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        {profileMap[item.submitted_by] ?? 'Unknown'} · {new Date(item.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[item.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#A8A29E] flex-shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#78716C]">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 0 && (
              <Link href={buildHref({ page: page - 1 })}>
                <Button variant="outline" size="sm">Previous</Button>
              </Link>
            )}
            {page < totalPages - 1 && (
              <Link href={buildHref({ page: page + 1 })}>
                <Button variant="outline" size="sm">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
