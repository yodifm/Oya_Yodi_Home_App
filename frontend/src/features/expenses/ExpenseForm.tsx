import { useState } from 'react'
import type { FormEvent } from 'react'
import { SelectField, TextAreaField, TextField } from '../../components/ui/Field'
import { FormActions } from '../../components/ui/FormActions'
import { ReceiptField } from '../../components/ui/Receipt'
import type { ReceiptChange } from '../../lib/receipts'
import { today } from '../../lib/format'
import { moneyInputProps } from '../../lib/money'
import type { Expense } from '../../types'
import { useMemberOptions } from '../auth/useAuth'
import { useCatalog } from '../catalog/useCatalog'
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
  const { categoryOptions, defaultCategory, defaultMethod, needsAccount } = useCatalog()
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    category: initial?.category ?? defaultCategory('groceries'),
    amount: initial ? String(initial.amount) : '',
    spent_at: initial?.spent_at ?? today(),
    payment_method: initial?.payment_method ?? defaultMethod(),
    payment_account: initial?.payment_account ?? '',
    paid_by: initial?.paid_by ?? defaultName,
    notes: initial?.notes ?? '',
  })
  const [receipt, setReceipt] = useState<ReceiptChange>({ kind: 'keep' })
  const showsAccount = needsAccount(form.payment_method)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(
      {
        ...form,
        amount: Number(form.amount),
        payment_account: showsAccount ? form.payment_account || null : null,
        notes: form.notes || null,
      },
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
          placeholder="0"
          {...moneyInputProps(form.amount, (v) => set('amount', v))}
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
          options={categoryOptions(initial?.category)}
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          error={errors.category}
        />
        <PaymentFields
          method={form.payment_method}
          account={form.payment_account}
          initial={initial ? { method: initial.payment_method, account: initial.payment_account } : undefined}
          onMethodChange={(m) => set('payment_method', m)}
          onAccountChange={(a) => set('payment_account', a)}
          errors={errors}
        />
        <SelectField
          label="Paid By"
          wrapperClassName={showsAccount ? undefined : 'sm:col-span-2'}
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
