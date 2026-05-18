import { notFound } from 'next/navigation'
import { requireAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ModerationActions } from '@/components/moderation/ModerationActions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ModerationDetailPage(props: {
  params: Promise<{ type: string; id: string }>
}) {
  await requireAccess(['super_admin', 'moderator'])
  const { type, id } = await props.params
  const supabase = await createClient()

  let content: any = null
  let authorName = ''
  let parentTitle = ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  if (type === 'testimony') {
    const { data } = await db
      .from('testimonies')
      .select('*, profiles!author_id(display_name, username, avatar_url)')
      .eq('id', id)
      .single()
    content = data
    authorName = data?.profiles?.display_name ?? '—'
  } else if (type === 'testimony_response') {
    const { data } = await db
      .from('testimony_responses')
      .select('*, profiles!author_id(display_name, username), testimonies(title)')
      .eq('id', id)
      .single()
    content = data
    authorName = data?.profiles?.display_name ?? '—'
    parentTitle = data?.testimonies?.title ?? ''
  } else if (type === 'resource') {
    const { data } = await db
      .from('resources')
      .select('*, profiles!added_by(display_name)')
      .eq('id', id)
      .single()
    content = data
    authorName = data?.profiles?.display_name ?? '—'
  } else {
    notFound()
  }

  if (!content) notFound()

  const TYPE_LABELS: Record<string, string> = {
    testimony: 'Story',
    testimony_response: 'Reply',
    resource: 'Resource',
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Link
        href="/moderation"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to queue
      </Link>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Review {TYPE_LABELS[type] ?? type}</h1>
        <Badge variant="outline">{content.status}</Badge>
      </div>

      {parentTitle && (
        <p className="text-sm text-zinc-500">
          In response to: <span className="font-medium">{parentTitle}</span>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{content.title ?? 'Content'}</CardTitle>
          <div className="text-sm text-zinc-500 flex gap-4 flex-wrap">
            <span>Author: <strong>{authorName}</strong></span>
            {content.category && <span>Category: <strong>{content.category}</strong></span>}
            {content.is_anonymous && <Badge variant="secondary">Anonymous</Badge>}
            {content.is_crisis && <Badge className="bg-red-100 text-red-700">Crisis</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {content.body && (
            <p className="text-sm whitespace-pre-wrap">{content.body}</p>
          )}
          {content.description && !content.body && (
            <p className="text-sm whitespace-pre-wrap">{content.description}</p>
          )}
          {(content.city || content.state) && (
            <p className="text-xs text-zinc-400">
              Location: {[content.city, content.state].filter(Boolean).join(', ')}
            </p>
          )}
          {content.website_url && (
            <p className="text-xs text-zinc-400">Website: {content.website_url}</p>
          )}
          {content.phone && (
            <p className="text-xs text-zinc-400">Phone: {content.phone}</p>
          )}
          <p className="text-xs text-zinc-400">
            Submitted: {new Date(content.created_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {content.status !== 'pending_review' && content.rejection_reason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">Rejection reason</p>
          <p className="text-sm text-red-900">{content.rejection_reason}</p>
        </div>
      )}

      <ModerationActions type={type} id={id} currentStatus={content.status} />
    </div>
  )
}
