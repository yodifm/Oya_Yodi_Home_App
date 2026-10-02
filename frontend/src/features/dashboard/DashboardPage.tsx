import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from '../../components/layout/icons'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { FilterSelect } from '../../components/ui/Field'
import { MonthStepper } from '../../components/ui/MonthStepper'
import { SectionLabel } from '../../components/ui/SectionLabel'
import { StatCard } from '../../components/ui/StatCard'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useAsync } from '../../hooks/useAsync'
import { cn } from '../../lib/cn'
import { currentMonth, formatCurrency, formatDate, formatMonth } from '../../lib/format'
import type { ExpenseCategory } from '../../types'
import { useCatalog } from '../catalog/useCatalog'
import { fetchDashboard } from './api'
import { BudgetBar } from '../budgets/BudgetBar'
import { CategoryBreakdown } from './CategoryBreakdown'
import { TrendChart } from './TrendChart'

/** "▲ 12% vs last month" — spending up is the cautionary direction. */
function MonthDelta({ current, previous }: { current: number; previous: number }) {
  if (!previous) return <span>No data for last month</span>
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return <span>Same as last month</span>
  const up = pct > 0
  return (
    <span>
      <span className={cn('font-mono font-medium', up ? 'text-danger' : 'text-success')}>
        {up ? '▲' : '▼'} {Math.abs(pct)}%
      </span>{' '}
      {up ? 'higher' : 'lower'} than last month
    </span>
  )
}

function MoreLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline decoration-accent underline-offset-4 transition-colors hover:text-foreground">
      {children} →
    </Link>
  )
}

/** A tappable row to another chapter, styled like the mobile More sheet. */
function JumpLink({ to, numeral, label, caption }: { to: string; numeral: string; label: string; caption: string }) {
  return (
    <Link
      to={to}
      className="group flex min-h-16 touch-manipulation items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-sm transition-all duration-200 hover:border-border-hover hover:shadow-md"
    >
      <span className="w-7 font-display text-sm italic text-accent">{numeral}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{caption}</span>
      </span>
      <span className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent">
        <ChevronRight />
      </span>
    </Link>
  )
}

export function DashboardPage() {
  const { categoryName: nameOf, categoryFilterOptions: categoryFilter } = useCatalog()
  const [month, setMonth] = useState(currentMonth())
  const [category, setCategory] = useState<ExpenseCategory | ''>('')
  const { data, loading, error, reload } = useAsync(() => fetchDashboard(month, category), [month, category])
  const categoryName = category ? nameOf(category) : null

  return (
    <>
      <PageHeader
        eyebrow="Chapter I — Overview"
        title={
          <>
            Home Finances, <span className="whitespace-nowrap italic text-accent">{formatMonth(month)}</span>
          </>
        }
        description="Where the household money went, what is still outstanding, and what we are saving for."
        actions={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <FilterSelect
              label="Filter by category"
              options={categoryFilter}
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory | '')}
              className="w-full bg-card shadow-sm sm:w-auto"
            />
            <MonthStepper month={month} onChange={setMonth} />
          </div>
        }
      />

      {loading && !data ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message={error ?? 'Data unavailable.'} onRetry={reload} />
      ) : (
        <div className={cn('animate-fade-in space-y-10 transition-opacity sm:space-y-16', loading && 'opacity-60')}>
          {/* Banner and figures share one group so the banner sits just above the
              cards. (A negative margin here fought space-y-16, which in Tailwind v4
              is also a margin on this element, and pulled the banner over the cards.) */}
          <div className="space-y-6">
            {categoryName && (
              <p
                role="status"
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-accent/30 bg-accent-muted px-4 text-sm text-muted-foreground"
              >
                <span className="small-caps text-accent">Filtered</span>
                <span>
                  Spending figures, trend and latest entries show <strong className="font-medium text-foreground">{categoryName}</strong> only.
                </span>
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className="ml-auto min-h-11 touch-manipulation text-accent underline underline-offset-4 hover:text-foreground"
                >
                  Show all
                </button>
              </p>
            )}
            <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-6 2xl:grid-cols-4">
              <StatCard
                featured
                className="col-span-2 sm:col-span-1"
                label={categoryName ? `Spent on ${categoryName}` : 'Spent this month'}
                value={formatCurrency(data.spending.this_month)}
                caption={<MonthDelta current={data.spending.this_month} previous={data.spending.last_month} />}
              />
              <StatCard
                label="Transactions"
                value={String(data.spending.transactions)}
                caption={
                  data.spending.transactions
                    ? `average ${formatCurrency(Math.round(data.spending.this_month / data.spending.transactions))}`
                    : 'nothing recorded yet'
                }
              />
              <StatCard
                label="Pending reimbursements"
                value={formatCurrency(data.reimbursements.pending_total)}
                caption={`${data.reimbursements.pending_count} claims · ${formatCurrency(data.reimbursements.approved_total)} ready to pay`}
              />
              <StatCard
                // Phones: full width so the 2-column grid has no lonely half card.
                className="col-span-2 sm:col-span-1"
                label="Wishlist still to save"
                value={formatCurrency(data.wishlist.remaining_total)}
                caption={`${data.wishlist.open_count} items · ${formatCurrency(data.wishlist.saved_total)} saved`}
              />
            </section>
          </div>

          <section aria-labelledby="budgets-heading">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                <SectionLabel align="start">Budgets</SectionLabel>
                <h2 id="budgets-heading" className="mt-4 text-2xl">
                  {data.budgets.length ? 'How the limits are holding' : 'No budgets yet'}
                </h2>
              </div>
              <MoreLink to="/budgets">{data.budgets.length ? 'Adjust budgets' : 'Set monthly budgets'}</MoreLink>
            </div>
            {data.budgets.length > 0 && (
              <Card className="grid gap-x-12 gap-y-6 p-4 sm:gap-y-8 sm:p-8 md:grid-cols-2">
                {data.budgets.map((b) => (
                  <BudgetBar key={b.category} label={nameOf(b.category)} spent={b.spent} limit={b.limit ?? 0} />
                ))}
              </Card>
            )}
          </section>

          <section className="grid gap-6 sm:gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <Card className="p-4 sm:p-8">
              <SectionLabel align="start">Six-Month Trend</SectionLabel>
              <h2 className="mb-8 mt-4 text-2xl">
                Spending over time
                {categoryName && <span className="italic text-accent"> · {categoryName}</span>}
              </h2>
              <TrendChart data={data.trend} selected={data.month} />
            </Card>

            <Card className="p-4 sm:p-8">
              <SectionLabel align="start">By Category</SectionLabel>
              <h2 className="mb-8 mt-4 text-2xl">Where it went</h2>
              <CategoryBreakdown rows={data.by_category} selected={category} onSelect={setCategory} />
            </Card>
          </section>

          <section>
            <SectionLabel>{categoryName ? `Latest in ${categoryName}` : 'Latest Entries'}</SectionLabel>
            <Card className="mt-8 divide-y divide-border">
              {data.recent_expenses.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">No expenses recorded yet.</p>
              ) : (
                data.recent_expenses.map((e) => (
                  <div key={e.id} className="flex items-center gap-4 px-4 py-3 sm:px-8 sm:py-4">
                    <span className="hidden w-20 shrink-0 font-mono text-xs text-muted-foreground sm:block">
                      {formatDate(e.spent_at, { year: undefined })}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {nameOf(e.category)} · {e.paid_by}
                      </p>
                    </div>
                    <span className="figure whitespace-nowrap">{formatCurrency(e.amount)}</span>
                  </div>
                ))
              )}
            </Card>
            {/* Onward links: stacked rows on phones, three across on wider screens. */}
            <nav aria-label="Jump to" className="mt-6 grid gap-3 sm:grid-cols-3">
              <JumpLink to="/expenses" numeral="II" label="All expenses" caption={`${data.spending.transactions} ${categoryName ? `${categoryName} ` : ''}entries in ${formatMonth(month)}`}
              />
              <JumpLink
                to="/reimbursements"
                numeral="III"
                label="Reimbursements"
                caption={`${data.reimbursements.pending_count} awaiting approval`}
              />
              <JumpLink to="/wishlist" numeral="IV" label="Wishlist" caption={`${data.wishlist.open_count} items to save for`} />
            </nav>
          </section>
        </div>
      )}
    </>
  )
}
