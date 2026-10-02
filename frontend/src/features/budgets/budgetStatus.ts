import type { BadgeTone } from '../../components/ui/Badge'

export interface BudgetHealth {
  ratio: number
  tone: BadgeTone
  label: string
}

/** Under 80% is fine, 80–100% is a warning, past 100% is over. Label always carries the meaning. */
export function budgetHealth(spent: number, limit: number): BudgetHealth {
  const ratio = limit > 0 ? spent / limit : 0
  if (ratio > 1) return { ratio, tone: 'danger', label: 'Over budget' }
  if (ratio >= 0.8) return { ratio, tone: 'accent', label: 'Nearly spent' }
  return { ratio, tone: 'success', label: 'On track' }
}
