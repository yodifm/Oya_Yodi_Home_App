import { useState } from 'react'
import type { FormEvent } from 'react'
import { SelectField, TextAreaField, TextField } from '../../components/ui/Field'
import { FormActions } from '../../components/ui/FormActions'
import { ReceiptField } from '../../components/ui/Receipt'
import type { ReceiptChange } from '../../lib/receipts'
import { today } from '../../lib/format'
import { reimbursementStatusLabels, toOptions } from '../../lib/labels'
import type { Reimbursement, ReimbursementStatus } from '../../types'
import { useMemberOptions } from '../auth/useAuth'
import type { ReimbursementInput } from './api'

interface ReimbursementFormProps {
  initial: Reimbursement | null
  saving: boolean
  errors: Record<string, string>
  onSubmit: (input: ReimbursementInput, receipt: ReceiptChange) => void
  onCancel: () => void
  /** Shown in the footer when editing (phones have no per-row delete). */
  onDelete?: () => void
}

export function ReimbursementForm({ initial, saving, errors, onSubmit, onCancel, onDelete }: ReimbursementFormProps) {
  const { options: memberOptions, defaultName } = useMemberOptions()
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    claimant: initial?.claimant ?? defaultName,
    amount: initial ? String(initial.amount) : '',
    status: initial?.status ?? ('pending' as ReimbursementStatus),
    submitted_at: initial?.submitted_at ?? today(),
    notes: initial?.notes ?? '',
  })
  const [receipt, setReceipt] = useState<ReceiptChange>({ kind: 'keep' })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ ...form, amount: Number(form.amount), notes: form.notes || null }, receipt)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        <TextField
          label="Purpose"
          wrapperClassName="sm:col-span-2"
          placeholder="e.g. Covered the electricity bill"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
          required
          autoFocus
        />
        <SelectField
          label="Claimed By"
          options={memberOptions}
          value={form.claimant}
          onChange={(e) => set('claimant', e.target.value)}
          error={errors.claimant}
        />
        <TextField
          label="Amount (Rp)"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          error={errors.amount}
          required
        />
        <TextField
          label="Date Submitted"
          type="date"
          value={form.submitted_at}
          onChange={(e) => set('submitted_at', e.target.value)}
          error={errors.submitted_at}
          required
        />
        <SelectField
          label="Status"
          options={toOptions(reimbursementStatusLabels)}
          value={form.status}
          onChange={(e) => set('status', e.target.value as ReimbursementStatus)}
          error={errors.status}
          hint="The settled date is recorded automatically when paid or rejected."
        />
        <TextAreaField
          label="Notes"
          wrapperClassName="sm:col-span-2"
          placeholder="Optional — receipt number, destination account, etc."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          error={errors.notes}
        />
        <ReceiptField hasExisting={!!initial?.has_receipt} value={receipt} onChange={setReceipt} />
      </div>
      <FormActions saving={saving} isEdit={!!initial} error={errors._form} onCancel={onCancel} onDelete={onDelete} />
    </form>
  )
}
