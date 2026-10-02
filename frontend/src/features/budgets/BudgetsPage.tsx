import { useState } from 'react'
import type { FormEvent } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { MonthStepper } from '../../components/ui/MonthStepper'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useAsync } from '../../hooks/useAsync'
import { cn } from '../../lib/cn'
import { api, ApiError } from '../../lib/api'
import { currentMonth, formatCurrency, formatMonth } from '../../lib/format'
import { moneyInputProps } from '../../lib/money'
import type { BudgetRow } from '../../types'
import { useCatalog } from '../catalog/useCatalog'
import { BudgetBar } from './BudgetBar'

const fetchBudgets = (month: string) => api.request<{ month: string; data: BudgetRow[] }>(`/budgets${api.query({ month })}`)

/** One category: its limit input and, when set, this month's progress. */
function BudgetEditor({ row, monthLabel, onSaved }: { row: BudgetRow; monthLabel: string; onSaved: () => void }) {
  const [value, setValue] = useState(row.limit ? String(row.limit) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const label = useCatalog().categoryName(row.category)
  const dirty = value !== (row.limit ? String(row.limit) : '')

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.request(`/budgets/${row.category}`, {
        method: 'PUT',
        body: JSON.stringify({ amount: value ? Number(value) : null }),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="grid gap-3 border-b border-border px-4 py-5 last:border-b-0 sm:gap-4 sm:px-8 sm:py-6 md:grid-cols-[minmax(0,1fr)_17rem] md:items-center md:gap-10">
      <div>
        {row.limit ? (
          <BudgetBar label={label} spent={row.spent} limit={row.limit} />
        ) : (
          <div>
            <p className="font-medium">{label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No budget · <span className="figure">{formatCurrency(row.spent)}</span> spent in {monthLabel}
            </p>
          </div>
        )}
      </div>
      <form onSubmit={save} className="flex items-start gap-2">
        <div className="flex-1">
          <label className="sr-only" htmlFor={`budget-${row.category}`}>
            Monthly budget for {label} (Rp)
          </label>
          <input
            id={`budget-${row.category}`}
            placeholder="No limit"
            {...moneyInputProps(value, setValue)}
            aria-invalid={!!error || undefined}
            className="h-11 w-full rounded-md border border-border bg-transparent px-3 text-base transition-all sm:text-sm duration-150 placeholder:text-muted-foreground/60 hover:border-border-hover focus-visible:border-accent aria-invalid:border-danger"
          />
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
        <Button type="submit" size="sm" variant={dirty ? 'primary' : 'outline'} disabled={!dirty || saving} className="min-h-11">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </li>
  )
}

export function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth())
  const { data, loading, error, reload } = useAsync(() => fetchBudgets(month), [month])

  const rows = data?.data ?? []
  const budgeted = rows.filter((r) => r.limit !== null)
  const totalLimit = budgeted.reduce((s, r) => s + (r.limit ?? 0), 0)
  const totalSpent = budgeted.reduce((s, r) => s + r.spent, 0)
  const over = budgeted.filter((r) => r.spent > (r.limit ?? 0)).length

  return (
    <>
      <PageHeader
        eyebrow="Chapter V — Budgets"
        title={
          <>
            Monthly <span className="italic text-accent">Limits</span>
          </>
        }
        description={`One standing limit per category, applied to every month. Pick a month to compare it with what was spent then; leave a field empty for no limit.`}
        actions={<MonthStepper month={month} onChange={setMonth} />}
      />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        // Dimmed while another month loads, so stale figures don't read as final.
        <div className={cn('transition-opacity', loading && 'opacity-60')}>
          <section aria-label="Budget summary" className="mb-8 grid grid-cols-2 gap-3 sm:mb-12 sm:grid-cols-3 sm:gap-6">
            <StatCard featured className="col-span-2 sm:col-span-1" label="Budgeted per month" value={formatCurrency(totalLimit)} caption={`${budgeted.length} of ${rows.length} categories`} />
            <StatCard
              label="Spent in budgeted categories"
              value={formatCurrency(totalSpent)}
              caption={totalLimit ? `${formatMonth(month)} · ${Math.round((totalSpent / totalLimit) * 100)}% of the total limit` : 'No limits set yet'}
            />
            <StatCard label="Over budget" value={String(over)} caption={over ? `categories past their limit in ${formatMonth(month, true)}` : 'Every category within its limit'} />
          </section>

          <Card accentTop>
            <ul>
              {rows.map((row) => (
                // Re-key on the saved limit so the input resets to the stored value after saving.
                <BudgetEditor key={`${row.category}:${row.limit}`} row={row} monthLabel={formatMonth(month)} onSaved={reload} />
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  )
}
