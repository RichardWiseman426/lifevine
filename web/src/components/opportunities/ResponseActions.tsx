'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateResponse } from '@/actions/opportunities'

export function ResponseActions({ responseId, orgId }: { responseId: string; orgId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700"
        disabled={isPending}
        onClick={() => startTransition(() => updateResponse(responseId, orgId, 'accepted'))}
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => startTransition(() => updateResponse(responseId, orgId, 'declined'))}
      >
        Decline
      </Button>
    </div>
  )
}
