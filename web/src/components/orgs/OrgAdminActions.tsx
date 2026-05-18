'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { setOrgVerified, setOrgActive } from '@/actions/orgs'

export function OrgAdminActions({
  orgId,
  isVerified,
  isActive,
}: {
  orgId: string
  isVerified: boolean
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(() => setOrgVerified(orgId, !isVerified))}
      >
        {isVerified ? 'Remove Verification' : 'Mark Verified'}
      </Button>
      <Button
        size="sm"
        variant={isActive ? 'destructive' : 'outline'}
        disabled={isPending}
        onClick={() => startTransition(() => setOrgActive(orgId, !isActive))}
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </Button>
    </div>
  )
}
