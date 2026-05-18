'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updatePlatformRole, setBanStatus } from '@/actions/users'

export function UserAdminActions({
  userId,
  currentRole,
  isBanned,
}: {
  userId: string
  currentRole: string
  isBanned: boolean
}) {
  const [role, setRole] = useState(currentRole)
  const [isPending, startTransition] = useTransition()

  function handleRoleChange() {
    if (role === currentRole) return
    startTransition(() => updatePlatformRole(userId, role))
  }

  return (
    <div className="flex flex-wrap gap-3 p-4 border rounded-lg bg-white">
      <div className="flex items-center gap-2">
        <Select value={role} onValueChange={(v) => setRole(v ?? role)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={isPending || role === currentRole}
          onClick={handleRoleChange}
        >
          Update Role
        </Button>
      </div>

      <Button
        size="sm"
        variant={isBanned ? 'outline' : 'destructive'}
        disabled={isPending}
        onClick={() => startTransition(() => setBanStatus(userId, !isBanned))}
      >
        {isBanned ? 'Unban User' : 'Ban User'}
      </Button>
    </div>
  )
}
