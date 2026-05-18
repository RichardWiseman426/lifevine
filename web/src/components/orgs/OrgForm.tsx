'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type OrgFormProps = {
  action: (formData: FormData) => Promise<void>
  defaultValues?: Record<string, string | null | undefined>
  submitLabel?: string
}

export function OrgForm({ action, defaultValues = {}, submitLabel = 'Save' }: OrgFormProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(defaultValues.name ?? '')

  function slugify(val: string) {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="space-y-1">
        <Label>Name *</Label>
        <Input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {!defaultValues.name && (
        <div className="space-y-1">
          <Label>Slug *</Label>
          <Input name="slug" required defaultValue={slugify(name)} />
          <p className="text-xs text-zinc-400">URL-safe identifier. Cannot be changed later.</p>
        </div>
      )}
      <div className="space-y-1">
        <Label>Short description</Label>
        <Input name="short_description" defaultValue={defaultValues.short_description ?? ''} />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea name="description" rows={4} defaultValue={defaultValues.description ?? ''} />
      </div>
      <div className="space-y-1">
        <Label>Category</Label>
        <Input name="category" defaultValue={defaultValues.category ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Website</Label>
          <Input name="website_url" type="url" defaultValue={defaultValues.website_url ?? ''} />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input name="email" type="email" defaultValue={defaultValues.email ?? ''} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>City</Label>
          <Input name="city" defaultValue={defaultValues.address_city ?? ''} />
        </div>
        <div className="space-y-1">
          <Label>State</Label>
          <Input name="state" maxLength={2} defaultValue={defaultValues.address_state ?? ''} />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
