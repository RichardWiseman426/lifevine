'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom (RRULE)' },
]

export function EventForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [isVirtual, setIsVirtual] = useState(false)
  const [recurrence, setRecurrence] = useState('none')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('recurrence', recurrence)
    if (isVirtual) fd.set('is_virtual', 'on')
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
      <div className="space-y-1">
        <Label>Category</Label>
        <Input name="category" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="is_virtual"
          checked={isVirtual}
          onCheckedChange={(v) => setIsVirtual(!!v)}
        />
        <Label htmlFor="is_virtual">Virtual event</Label>
      </div>
      {isVirtual && (
        <div className="space-y-1">
          <Label>Virtual URL</Label>
          <Input name="virtual_url" type="url" />
        </div>
      )}
      {!isVirtual && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>City</Label>
            <Input name="address_city" />
          </div>
          <div className="space-y-1">
            <Label>State</Label>
            <Input name="address_state" maxLength={2} />
          </div>
        </div>
      )}
      <div className="space-y-1">
        <Label>Max attendees</Label>
        <Input name="max_attendees" type="number" min={1} />
      </div>

      <div className="border-t pt-4 space-y-3">
        <h3 className="font-medium text-sm">Schedule</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Start date & time *</Label>
            <Input name="starts_at" type="datetime-local" required />
          </div>
          <div className="space-y-1">
            <Label>End date & time</Label>
            <Input name="ends_at" type="datetime-local" />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Recurrence</Label>
          <Select value={recurrence} onValueChange={(v) => setRecurrence(v ?? 'none')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECURRENCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {recurrence === 'custom' && (
          <div className="space-y-1">
            <Label>RRULE</Label>
            <Input name="rrule" placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR" />
          </div>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creating…' : 'Create Event'}
      </Button>
    </form>
  )
}
