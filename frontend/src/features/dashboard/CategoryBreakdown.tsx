import { cn } from '../../lib/cn'
import { formatCurrency } from '../../lib/format'
import { categoryLabels } from '../../lib/labels'
import type { DashboardSummary, ExpenseCategory } from '../../types'

interface CategoryBreakdownProps {
  rows: DashboardSummary['by_category']
  /** The currently filtered category, if any — highlighted, others recede. */
  selected: ExpenseCategory | ''
  onSelect: (category: ExpenseCategory | '') => void
}

/**
 * Ranked category list with a thin magnitude bar under each row. Plain HTML
 * rather than a chart: every value is labelled, so it reads like a ledger.
 * Each row doubles as a filter toggle for the whole overview.
 */
export function CategoryBreakdown({ rows, selected, onSelect }: CategoryBreakdownProps) {
  const max = rows[0]?.total ?? 0
  const total = rows.reduce((sum, r) => sum + r.total, 0)

  if (!rows.length) {
    return <p className="py-10 text-center text-muted-foreground">No spending recorded this month.</p>
  }

  return (
    <ol className="-mx-3 flex flex-col gap-1">
      {rows.map((row, i) => {
        const share = total ? Math.round((row.total / total) * 100) : 0
        const active = selected === row.category
        const dimmed = selected !== '' && !active
        return (
          <li key={row.category}>
            <button
              type="button"
              onClick={() => onSelect(active ? '' : row.category)}
              aria-pressed={active}
              title={active ? 'Show all categories' : `Show only ${categoryLabels[row.category]}`}
              className={cn(
                'w-full touch-manipulation rounded-md px-3 py-2.5 text-left transition-all duration-200 hover:bg-muted/60',
                active && 'bg-accent-muted ring-1 ring-accent/30',
                dimmed && 'opacity-45 hover:opacity-100',
              )}
            >
              <span className="flex items-baseline justify-between gap-4">
                <span className="flex items-baseline gap-3">
                  <span className="w-5 font-display text-sm italic text-muted-foreground/70">{i + 1}.</span>
                  <span className="font-medium">{categoryLabels[row.category]}</span>
                </span>
                <span className="whitespace-nowrap text-sm">
                  <span className="figure">{formatCurrency(row.total)}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{share}%</span>
                </span>
              </span>
              <span className="ml-8 mt-2 block h-1 rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                  style={{ width: `${max ? (row.total / max) * 100 : 0}%`, opacity: active || (selected === '' && i === 0) ? 1 : 0.55 }}
                />
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
