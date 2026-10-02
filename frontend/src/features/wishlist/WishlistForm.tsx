import { useState } from 'react'
import type { FormEvent } from 'react'
import { SelectField, TextAreaField, TextField } from '../../components/ui/Field'
import { FormActions } from '../../components/ui/FormActions'
import { priorityLabels, toOptions, wishlistStatusLabels } from '../../lib/labels'
import type { WishlistItem, WishlistPriority, WishlistStatus } from '../../types'
import type { WishlistInput } from './api'

interface WishlistFormProps {
  initial: WishlistItem | null
  saving: boolean
  errors: Record<string, string>
  onSubmit: (input: WishlistInput) => void
  onCancel: () => void
}

export function WishlistForm({ initial, saving, errors, onSubmit, onCancel }: WishlistFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    estimated_price: initial ? String(initial.estimated_price) : '',
    saved_amount: initial ? String(initial.saved_amount) : '0',
    priority: initial?.priority ?? ('medium' as WishlistPriority),
    status: initial?.status ?? ('wanted' as WishlistStatus),
    target_date: initial?.target_date ?? '',
    url: initial?.url ?? '',
    notes: initial?.notes ?? '',
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      estimated_price: Number(form.estimated_price),
      saved_amount: Number(form.saved_amount || 0),
      target_date: form.target_date || null,
      url: form.url || null,
      notes: form.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        <TextField
          label="Item Name"
          wrapperClassName="sm:col-span-2"
          placeholder="e.g. Two-door refrigerator"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          required
          autoFocus
        />
        <TextField
          label="Estimated Price (Rp)"
          type="number"
          inputMode="numeric"
          min={0}
          value={form.estimated_price}
          onChange={(e) => set('estimated_price', e.target.value)}
          error={errors.estimated_price}
          required
        />
        <TextField
          label="Saved So Far (Rp)"
          type="number"
          inputMode="numeric"
          min={0}
          value={form.saved_amount}
          onChange={(e) => set('saved_amount', e.target.value)}
          error={errors.saved_amount}
        />
        <SelectField
          label="Priority"
          options={toOptions(priorityLabels)}
          value={form.priority}
          onChange={(e) => set('priority', e.target.value as WishlistPriority)}
          error={errors.priority}
        />
        <SelectField
          label="Status"
          options={toOptions(wishlistStatusLabels)}
          value={form.status}
          onChange={(e) => set('status', e.target.value as WishlistStatus)}
          error={errors.status}
          hint={
            initial?.expense_id && form.status !== 'purchased'
              ? 'Its recorded purchase stays in the expense book — delete it there if it never happened.'
              : undefined
          }
        />
        <TextField
          label="Target Date"
          type="date"
          value={form.target_date}
          onChange={(e) => set('target_date', e.target.value)}
          error={errors.target_date}
        />
        <TextField
          label="Product Link"
          type="url"
          placeholder="https://"
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
          error={errors.url}
        />
        <TextAreaField
          label="Notes"
          wrapperClassName="sm:col-span-2"
          placeholder="Optional"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          error={errors.notes}
        />
      </div>
      <FormActions saving={saving} isEdit={!!initial} error={errors._form} onCancel={onCancel} />
    </form>
  )
}
