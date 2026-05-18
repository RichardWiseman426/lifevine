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

const CATEGORIES = [
  'mental_health', 'crisis', 'housing', 'food', 'medical',
  'legal', 'financial', 'substance', 'spiritual', 'community', 'other',
]

export function ResourceForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [category, setCategory] = useState('')
  const [isCrisis, setIsCrisis] = useState(false)
  const [isNational, setIsNational] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('category', category)
    if (isCrisis) fd.set('is_crisis', 'on')
    if (isNational) fd.set('is_national', 'on')
    startTransition(() => action(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="space-y-1">
        <Label>Title *</Label>
        <Input name="title" required />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea name="description" rows={3} />
      </div>
      <div className="space-y-1">
        <Label>Category *</Label>
        <Select value={category} onValueChange={(v) => setCategory(v ?? '')} required>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input name="phone" type="tel" />
        </div>
        <div className="space-y-1">
          <Label>Website</Label>
          <Input name="website_url" type="url" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Checkbox id="is_crisis" checked={isCrisis} onCheckedChange={(v) => setIsCrisis(!!v)} />
          <Label htmlFor="is_crisis">Crisis resource</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="is_national" checked={isNational} onCheckedChange={(v) => setIsNational(!!v)} />
          <Label htmlFor="is_national">National</Label>
        </div>
      </div>
      {!isNational && (
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
      <Button type="submit" disabled={isPending || !category}>
        {isPending ? 'Adding…' : 'Add Resource'}
      </Button>
    </form>
  )
}
