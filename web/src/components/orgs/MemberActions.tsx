'use client'

import { useTransition } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { changeMemberRole, suspendMember, removeMember } from '@/actions/members'

export function MemberActions({
  orgId,
  memberId,
  currentRole,
  currentStatus,
}: {
  orgId: string
  memberId: string
  currentRole: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-md p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentRole !== 'owner' && (
          <DropdownMenuItem
            onClick={() => startTransition(() => changeMemberRole(orgId, memberId, 'owner'))}
          >
            Make Owner
          </DropdownMenuItem>
        )}
        {currentRole !== 'admin' && (
          <DropdownMenuItem
            onClick={() => startTransition(() => changeMemberRole(orgId, memberId, 'admin'))}
          >
            Make Admin
          </DropdownMenuItem>
        )}
        {currentRole !== 'contributor' && (
          <DropdownMenuItem
            onClick={() => startTransition(() => changeMemberRole(orgId, memberId, 'contributor'))}
          >
            Make Contributor
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {currentStatus === 'active' && (
          <DropdownMenuItem
            className="text-amber-600"
            onClick={() => startTransition(() => suspendMember(orgId, memberId))}
          >
            Suspend
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => startTransition(() => removeMember(orgId, memberId))}
        >
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
