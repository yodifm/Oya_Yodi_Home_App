import { useState } from 'react'
import type { FormEvent } from 'react'
import { TextField } from '../../components/ui/Field'
import { FormActions } from '../../components/ui/FormActions'
import { Switch } from '../../components/ui/Switch'
import type { ManagedUser } from '../../types'
import type { UserInput } from './api'

interface UserFormProps {
  initial: ManagedUser | null
  saving: boolean
  errors: Record<string, string>
  onSubmit: (input: UserInput) => void
  onCancel: () => void
}

export function UserForm({ initial, saving, errors, onSubmit, onCancel }: UserFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    password: '',
    password_confirmation: '',
    email_notifications: initial?.email_notifications ?? true,
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password || null,
      password_confirmation: form.password_confirmation || null,
      email_notifications: form.email_notifications,
    })
  }

  const isEdit = !!initial

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        <TextField
          label="Name"
          placeholder="e.g. Mama"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          hint={isEdit && initial.expenses_count + initial.claims_count > 0 ? 'Renaming also updates their existing expenses and claims.' : 'Shown in the “Paid by” and “Claimed by” lists.'}
          required
          autoFocus
        />
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder="name@gmail.com"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          required
        />
        <TextField
          label={isEdit ? 'New Password' : 'Password'}
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
          hint={isEdit ? 'Leave blank to keep the current password.' : 'At least 8 characters.'}
          required={!isEdit}
        />
        <TextField
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          value={form.password_confirmation}
          onChange={(e) => set('password_confirmation', e.target.value)}
          required={!isEdit}
        />
        <div className="rounded-md border border-border px-4 py-2 sm:col-span-2">
          <Switch
            label="Email updates"
            description="New expenses and claims from others, claim status changes, and budgets that go over."
            checked={form.email_notifications}
            onChange={(v) => set('email_notifications', v)}
          />
        </div>
      </div>
      {isEdit && form.password && (
        <p className="mt-6 text-sm text-muted-foreground">
          Changing the password signs {initial.name} out on every other device.
        </p>
      )}
      <FormActions saving={saving} isEdit={isEdit} error={errors._form} onCancel={onCancel} />
    </form>
  )
}
