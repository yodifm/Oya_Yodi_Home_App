import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { SectionLabel } from '../../components/ui/SectionLabel'
import { StatCard } from '../../components/ui/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { currentYear, formatCurrency, formatMonth } from '../../lib/format'
import { useCatalog } from '../catalog/useCatalog'
import type { YearReport } from '../../types'
import { TrendChart } from '../dashboard/TrendChart'

const fetchReport = (year: number) => api.request<YearReport>(`/reports${api.query({ year: String(year) })}`)

function YearStepper({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  const step =
    'grid size-11 touch-manipulation place-items-center rounded-md text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-accent disabled:pointer-events-none disabled:opacity-30'
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card shadow-sm">
      <button type="button" className={step} onClick={() => onChange(year - 1)} aria-label="Previous year">
        ‹
      </button>
      <span className="min-w-24 text-center font-display italic" aria-live="polite">
        {year}
      </span>
      <button type="button" className={step} onClick={() => onChange(year + 1)} disabled={year >= currentYear()} aria-label="Next year">
        ›
      </button>
    </div>
  )
}

/** "▲ 12% vs 2025" — up is the cautionary direction for spending. */
function YearDelta({ current, previous, year }: { current: number; previous: number; year: number }) {
  if (!previous) return <span>No data for {year - 1}</span>
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct > 0
  return (
    <span>
      <span className={cn('font-mono font-medium', up ? 'text-danger' : 'text-success')}>
        {up ? '▲' : '▼'} {Math.abs(pct)}%
      </span>{' '}
      vs {formatCurrency(previous)} in {year - 1}
    </span>
  )
}

export function ReportsPage() {
  const { categoryName } = useCatalog()
  const [year, setYear] = useState(currentYear)
  const { data, loading, error, reload } = useAsync(() => fetchReport(year), [year])

  const maxCategory = data?.by_category[0]?.total ?? 0

  return (
    <>
      <PageHeader
        eyebrow="Chapter VI — Reports"
        title={
          <>
            The Year in <span className="italic text-accent">Review</span>
          </>
        }
        description="How the household spent across the year, which categories carry the weight, and what moved most recently."
        actions={<YearStepper year={year} onChange={setYear} />}
      />

      {loading && !data ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message={error ?? 'Report unavailable.'} onRetry={reload} />
      ) : data.total === 0 ? (
        <Card>
          <EmptyState title={`Nothing recorded in ${year}`} message="Reports appear once there are expenses for the year." />
        </Card>
      ) : (
        <div className={cn('animate-fade-in space-y-10 transition-opacity sm:space-y-16', loading && 'opacity-60')}>
          <section aria-label="Year figures" className="grid grid-cols-2 gap-3 sm:gap-6 2xl:grid-cols-4">
            <StatCard featured className="col-span-2 sm:col-span-1" label={`Spent in ${year}`} value={formatCurrency(data.total)} caption={<YearDelta current={data.total} previous={data.previous_year_total} year={year} />} />
            <StatCard label="Average per month" value={formatCurrency(data.average_per_month)} caption={`over ${data.months_elapsed} month${data.months_elapsed === 1 ? '' : 's'}`} />
            <StatCard
              label="Highest month"
              value={data.highest_month ? formatMonth(data.highest_month.month, true) : '—'}
              caption={data.highest_month ? formatCurrency(data.highest_month.total) : undefined}
            />
            <StatCard
              label="Largest category"
              value={data.by_category[0] ? categoryName(data.by_category[0].category) : '—'}
              caption={data.by_category[0] ? `${data.by_category[0].share}% of the year` : undefined}
            />
          </section>

          <Card className="p-4 sm:p-8">
            <SectionLabel align="start">Month by Month</SectionLabel>
            <h2 className="mb-8 mt-4 text-2xl">Spending through {year}</h2>
            <TrendChart data={data.months} selected={data.changes.month} />
          </Card>

          <section className="grid gap-6 sm:gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <Card className="p-4 sm:p-8">
              <SectionLabel align="start">By Category</SectionLabel>
              <h2 className="mb-8 mt-4 text-2xl">Share of the year</h2>
              <ol className="flex flex-col gap-5">
                {data.by_category.map((row, i) => (
                  <li key={row.category}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="flex items-baseline gap-3">
                        <span className="w-5 font-display text-sm italic text-muted-foreground/70">{i + 1}.</span>
                        <span className="font-medium">{categoryName(row.category)}</span>
                      </span>
                      <span className="whitespace-nowrap text-sm">
                        <span className="figure">{formatCurrency(row.total)}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">{row.share}%</span>
                      </span>
                    </div>
                    <div className="ml-8 mt-2 h-1 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${maxCategory ? (row.total / maxCategory) * 100 : 0}%`, opacity: i === 0 ? 1 : 0.55 }} />
                    </div>
                  </li>
                ))}
              </ol>
            </Card>

            <Card className="p-4 sm:p-8">
              <SectionLabel align="start">Biggest Movers</SectionLabel>
              <h2 className="mt-4 text-2xl">
                {formatMonth(data.changes.month, true)} <span className="text-muted-foreground">vs</span> {formatMonth(data.changes.previous_month, true)}
              </h2>
              <p className="mb-6 mt-1 text-sm text-muted-foreground">Change per category from the month before.</p>
              {data.changes.rows.length === 0 ? (
                <p className="py-6 text-muted-foreground">No spending in either month.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.changes.rows.map((row) => {
                    const up = row.change > 0
                    return (
                      <li key={row.category} className="flex items-baseline justify-between gap-4 py-3">
                        <span>
                          <span className="font-medium">{categoryName(row.category)}</span>
                          <span className="block text-xs text-muted-foreground">
                            {formatCurrency(row.previous)} → {formatCurrency(row.current)}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'whitespace-nowrap font-mono text-sm',
                            row.change === 0 ? 'text-muted-foreground' : up ? 'text-danger' : 'text-success',
                          )}
                        >
                          {row.change === 0 ? '—' : `${up ? '▲' : '▼'} ${formatCurrency(Math.abs(row.change))}`}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </section>
        </div>
      )}
    </>
  )
}
