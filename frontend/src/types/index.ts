/** A household member — one login account each. */
export interface User {
  id: number
  name: string
  email: string
}

export type ExpenseCategory =
  | 'groceries'
  | 'food'
  | 'utilities'
  | 'transport'
  | 'household'
  | 'health'
  | 'education'
  | 'entertainment'
  | 'other'

export type PaymentMethod = 'cash' | 'transfer' | 'e-wallet'

/** The account a bank transfer came from. */
export type Bank = 'bca' | 'line_bank' | 'mandiri'

export interface Expense {
  id: number
  title: string
  category: ExpenseCategory
  amount: number
  spent_at: string
  payment_method: PaymentMethod
  /** Set for bank transfers; null for cash/e-wallet (and older transfers). */
  bank: Bank | null
  paid_by: string
  notes: string | null
  has_receipt: boolean
}

export type ReimbursementStatus = 'pending' | 'approved' | 'paid' | 'rejected'

export interface Reimbursement {
  id: number
  title: string
  claimant: string
  amount: number
  status: ReimbursementStatus
  submitted_at: string
  settled_at: string | null
  notes: string | null
  has_receipt: boolean
}

export type WishlistPriority = 'low' | 'medium' | 'high'
export type WishlistStatus = 'wanted' | 'saving' | 'purchased'

export interface WishlistItem {
  id: number
  name: string
  estimated_price: number
  saved_amount: number
  priority: WishlistPriority
  status: WishlistStatus
  target_date: string | null
  url: string | null
  notes: string | null
  /** The expense recorded when it was purchased. */
  expense_id: number | null
  /** Who added the wish (null for wishes added before this was tracked). */
  created_by: string | null
  created_at: string | null
}

/** A user as shown on the Users page, with how many records reference them. */
export interface ManagedUser extends User {
  created_at: string | null
  expenses_count: number
  claims_count: number
  /** Household email updates (new expenses, claims, budget alerts). */
  email_notifications: boolean
}

/** Monthly limit vs. actual spending for one category (limit null = no budget). */
export interface BudgetRow {
  category: ExpenseCategory
  limit: number | null
  spent: number
}

/** Laravel paginated resource collection, plus the endpoint's own summary. */
export interface Paginated<T, TSummary = unknown> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null }
  summary: TSummary
}

export interface YearReport {
  year: number
  total: number
  previous_year_total: number
  average_per_month: number
  months_elapsed: number
  highest_month: { month: string; total: number } | null
  months: { month: string; total: number }[]
  by_category: { category: ExpenseCategory; total: number; share: number }[]
  changes: {
    month: string
    previous_month: string
    rows: { category: ExpenseCategory; current: number; previous: number; change: number }[]
  }
}

export interface DashboardSummary {
  month: string
  category: ExpenseCategory | null
  spending: {
    this_month: number
    last_month: number
    transactions: number
  }
  by_category: { category: ExpenseCategory; total: number }[]
  trend: { month: string; total: number }[]
  reimbursements: {
    pending_total: number
    pending_count: number
    approved_total: number
  }
  wishlist: {
    remaining_total: number
    saved_total: number
    open_count: number
  }
  recent_expenses: Expense[]
  budgets: BudgetRow[]
}

/** Laravel validation error payload (HTTP 422). */
export interface ValidationErrors {
  message: string
  errors: Record<string, string[]>
}
