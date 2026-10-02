import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/cn'
import { formatCurrency } from '../../lib/format'
import { budgetHealth } from './budgetStatus'

/**
 * Spent-vs-limit rule. The fill is gold while within budget and turns red only
 * for the overspent part, so "how far over" reads at a glance.
 */
export function BudgetBar({ label, spent, limit }: { label: string; spent: number; limit: number }) {
  const health = budgetHealth(spent, limit)
  const within = Math.min(1, health.ratio)
  // When over, scale the track so limit + overspend fit: the limit marker sits inside.
  const scale = Math.max(1, health.ratio)

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-medium">{label}</span>
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          <span className="figure text-foreground">{formatCurrency(spent)}</span> of {formatCurrency(limit)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label}: ${Math.round(health.ratio * 100)}% of budget used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(health.ratio, 1) * 100)}
        className="relative mt-2 flex h-1.5 overflow-hidden rounded-full bg-border"
      >
        <div className={cn('h-full', health.tone === 'danger' ? 'bg-accent/60' : 'bg-accent')} style={{ width: `${(within / scale) * 100}%` }} />
        {health.ratio > 1 && <div className="h-full bg-danger" style={{ width: `${((health.ratio - 1) / scale) * 100}%` }} />}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <Badge tone={health.tone}>{health.label}</Badge>
        <span>
          {health.ratio > 1
            ? `${formatCurrency(spent - limit)} over`
            : `${formatCurrency(limit - spent)} left · ${Math.round(health.ratio * 100)}%`}
        </span>
      </div>
    </div>
  )
}
