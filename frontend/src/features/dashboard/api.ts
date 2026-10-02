import { api } from '../../lib/api'
import type { DashboardSummary, ExpenseCategory } from '../../types'

export const fetchDashboard = (month: string, category: ExpenseCategory | '') =>
  api.request<DashboardSummary>(`/dashboard${api.query({ month, category })}`)
