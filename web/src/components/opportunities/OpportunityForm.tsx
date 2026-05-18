'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

export function OpportunityForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [isRemote, setIsRemote] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (isRemote) fd.set('is_remote', 'on')
    startTransition(() => action(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Title *</Label>
        <Input name="title" required />
      </div>
      <div className="space-y-1">
        <Label>Short description</Label>
        <Input name="short_description" />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea name="description" rows={4} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Category</Label>
          <Input name="category" />
        </div>
        <div className="space-y-1">
          <Label>Total spots</Label>
          <Input name="spots_total" type="number" min={1} placeholder="Leave blank for unlimited" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="is_remote"
          checked={isRemote}
          onCheckedChange={(v) => setIsRemote(!!v)}
        />
        <Label htmlFor="is_remote">Remote opportunity</Label>
      </div>
      {!isRemote && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>City</Label>
            <Input name="city" />
          </div>
          <div className="space-y-1">
            <Label>State</Label>
            <Input name="state" maxLength={2} />
          </div>
        </div>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creating…' : 'Create Opportunity'}
      </Button>
    </form>
  )
}
