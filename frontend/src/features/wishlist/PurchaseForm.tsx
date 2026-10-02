import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { SelectField, TextField } from '../../components/ui/Field'
import { ApiError } from '../../lib/api'
import { formatCurrency, today } from '../../lib/format'
import { moneyInputProps } from '../../lib/money'
import type { WishlistItem } from '../../types'
import { useMemberOptions } from '../auth/useAuth'
import { useCatalog } from '../catalog/useCatalog'
import { PaymentFields } from '../expenses/PaymentFields'
import { purchaseItem } from './api'

/** "We bought it": records the actual price paid as an expense and closes the wish. */
export function PurchaseForm({ item, onDone, onCancel }: { item: WishlistItem; onDone: () => void; onCancel: () => void }) {
  const { options: memberOptions, defaultName } = useMemberOptions()
  const { categoryOptions, defaultCategory, defaultMethod, showsAccount: accountShown } = useCatalog()
  const [form, setForm] = useState({
    amount: String(item.estimated_price),
    category: defaultCategory('household'),
    spent_at: today(),
    payment_method: defaultMethod(),
    payment_account: '',
    paid_by: defaultName,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const showsAccount = accountShown(form.payment_method)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      await purchaseItem(item.id, {
        ...form,
        amount: Number(form.amount),
        payment_account: showsAccount ? form.payment_account || null : null,
      })
      onDone()
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])))
      } else {
        setErrors({ _form: err instanceof Error ? err.message : 'Something went wrong.' })
      }
    } finally {
      setSaving(false)
    }
  }

  const formError = errors._form ?? errors.item

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="mb-8 text-muted-foreground">
        This marks the wish as purchased and adds the price you actually paid to the expense book. It was
        estimated at <span className="figure text-foreground">{formatCurrency(item.estimated_price)}</span>.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        <TextField
          label="Price Paid (Rp)"
          {...moneyInputProps(form.amount, (v) => set('amount', v))}
          error={errors.amount}
          required
          autoFocus
        />
        <TextField label="Date" type="date" value={form.spent_at} onChange={(e) => set('spent_at', e.target.value)} error={errors.spent_at} required />
        <SelectField
          label="Category"
          options={categoryOptions()}
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          error={errors.category}
        />
        <PaymentFields
          method={form.payment_method}
          account={form.payment_account}
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
      </div>
      {formError && (
        <p role="alert" className="mt-6 rounded-md bg-danger-muted px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      )}
      {/* Same sticky footer as FormActions: Save stays in reach on phones. */}
      <div className="sticky bottom-0 -mx-5 mt-8 flex items-center justify-end gap-3 border-t border-border bg-card px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:mt-10 sm:px-0 sm:pb-0 sm:pt-6">
        <span className="hidden sm:block">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </span>
        <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
          {saving ? 'Recording…' : 'Record Purchase'}
        </Button>
      </div>
    </form>
  )
}
