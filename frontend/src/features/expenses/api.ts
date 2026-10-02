import { api, resource } from '../../lib/api'
import type { Expense } from '../../types'

/** What the form sends; the receipt is managed separately. */
export type ExpenseInput = Omit<Expense, 'id' | 'has_receipt'>

export interface ExpenseSummary {
  count: number
  total_amount: number
}

export const expensesApi = resource<Expense, ExpenseInput, ExpenseSummary>('expenses')

export type ExpenseFilters = { month?: string; category?: string; q?: string }

export const exportExpenses = (filters: ExpenseFilters) =>
  api.download(`/expenses/export${api.query(filters)}`, `expenses-${filters.month ?? 'all'}.csv`)
