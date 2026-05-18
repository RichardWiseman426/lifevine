'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { approveContent, rejectContent, resetContent } from '@/actions/moderation'

export function ModerationActions({
  type,
  id,
  currentStatus,
}: {
  type: string
  id: string
  currentStatus: string
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(() => approveContent(type, id))
  }

  function handleReject() {
    if (!reason.trim()) return
    startTransition(() => {
      rejectContent(type, id, reason)
      setRejectOpen(false)
    })
  }

  function handleReset() {
    startTransition(() => resetContent(type, id))
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {currentStatus !== 'approved' && (
          <Button onClick={handleApprove} disabled={isPending} className="bg-[#2D6A4F] hover:bg-[#245840] text-white font-bold rounded-xl">
            Approve
          </Button>
        )}
        {currentStatus !== 'rejected' && (
          <Button
            variant="destructive"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
            className="rounded-xl font-bold"
          >
            Reject
          </Button>
        )}
        {currentStatus !== 'pending_review' && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isPending}
            className="rounded-xl font-bold"
          >
            Reset to Pending
          </Button>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for rejection</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this content is being rejected…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!reason.trim() || isPending}>
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
