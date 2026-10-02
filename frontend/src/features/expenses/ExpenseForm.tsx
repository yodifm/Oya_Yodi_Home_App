import { useState } from 'react'
import type { FormEvent } from 'react'
import { SelectField, TextAreaField, TextField } from '../../components/ui/Field'
import { FormActions } from '../../components/ui/FormActions'
import { ReceiptField } from '../../components/ui/Receipt'
import type { ReceiptChange } from '../../lib/receipts'
import { today } from '../../lib/format'
import { bankForSubmit, categoryLabels, toOptions } from '../../lib/labels'
import type { Bank, Expense, ExpenseCategory, PaymentMethod } from '../../types'
import { useMemberOptions } from '../auth/useAuth'
import type { ExpenseInput } from './api'
import { PaymentFields } from './PaymentFields'

interface ExpenseFormProps {
  initial: Expense | null
  saving: boolean
  errors: Record<string, string>
  onSubmit: (input: ExpenseInput, receipt: ReceiptChange) => void
  onCancel: () => void
  /** Shown in the footer when editing (phones have no per-row delete). */
  onDelete?: () => void
}

export function ExpenseForm({ initial, saving, errors, onSubmit, onCancel, onDelete }: ExpenseFormProps) {
  const { options: memberOptions, defaultName } = useMemberOptions()
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    category: initial?.category ?? ('groceries' as ExpenseCategory),
    amount: initial ? String(initial.amount) : '',
    spent_at: initial?.spent_at ?? today(),
    payment_method: initial?.payment_method ?? ('transfer' as PaymentMethod),
    bank: (initial?.bank ?? '') as Bank | '',
    paid_by: initial?.paid_by ?? defaultName,
    notes: initial?.notes ?? '',
  })
  const [receipt, setReceipt] = useState<ReceiptChange>({ kind: 'keep' })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(
      { ...form, amount: Number(form.amount), bank: bankForSubmit(form.payment_method, form.bank), notes: form.notes || null },
      receipt,
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        <TextField
          label="Description"
          wrapperClassName="sm:col-span-2"
          placeholder="e.g. Weekly market groceries"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
          required
          autoFocus
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
          label="Date"
          type="date"
          value={form.spent_at}
          onChange={(e) => set('spent_at', e.target.value)}
          error={errors.spent_at}
          required
        />
        <SelectField
          label="Category"
          options={toOptions(categoryLabels)}
          value={form.category}
          onChange={(e) => set('category', e.target.value as ExpenseCategory)}
          error={errors.category}
        />
        <PaymentFields
          method={form.payment_method}
          bank={form.bank}
          onMethodChange={(m) => set('payment_method', m)}
          onBankChange={(b) => set('bank', b)}
          errors={errors}
        />
        <SelectField
          label="Paid By"
          wrapperClassName={form.payment_method === 'transfer' ? undefined : 'sm:col-span-2'}
          options={memberOptions}
          value={form.paid_by}
          onChange={(e) => set('paid_by', e.target.value)}
          error={errors.paid_by}
        />
        <TextAreaField
          label="Notes"
          wrapperClassName="sm:col-span-2"
          placeholder="Optional"
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
