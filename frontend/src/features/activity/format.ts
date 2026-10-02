import { formatCurrency, formatDate } from '../../lib/format'
import { priorityLabels, reimbursementStatusLabels, wishlistStatusLabels } from '../../lib/labels'
import type { CatalogHelpers } from '../catalog/useCatalog'

export type ActivityAction = 'created' | 'updated' | 'deleted'
export type ActivitySubject =
  | 'expense'
  | 'reimbursement'
  | 'wishlist_item'
  | 'budget'
  | 'user'
  | 'category'
  | 'payment_method'
  | 'payment_account'

export interface ActivityEntry {
  id: number
  /** Null for changes made outside a signed-in session (or by a deleted user). */
  user: string | null
  action: ActivityAction
  subject_type: ActivitySubject
  subject_id: number | null
  summary: string
  /** Updates only: field → [old, new]; a null value means "changed, value not recorded". */
  changes: Record<string, [unknown, unknown] | null> | null
  created_at: string
}

/** The type filter; "payment" covers payment methods and their accounts. */
export const typeFilterLabels: Record<string, string> = {
  expense: 'Expenses',
  reimbursement: 'Reimbursements',
  wishlist_item: 'Wishlist',
  budget: 'Budgets',
  category: 'Categories',
  payment: 'Payments',
  user: 'Users',
}

const nouns: Record<ActivitySubject, string> = {
  expense: 'an expense',
  reimbursement: 'a claim',
  wishlist_item: 'a wish',
  budget: 'a budget',
  user: 'a user',
  category: 'a category',
  payment_method: 'a payment method',
  payment_account: 'a payment account',
}

const verbs: Record<ActivityAction, string> = { created: 'added', updated: 'edited', deleted: 'removed' }

/** "added an expense", "edited a claim", … */
export const describe = (e: ActivityEntry) => `${verbs[e.action]} ${nouns[e.subject_type]}`

/** Budgets are stored by category key; everything else already reads well. */
export const summaryText = (e: ActivityEntry, catalog: CatalogHelpers) =>
  e.subject_type === 'budget' ? `${catalog.categoryName(e.summary)} budget` : e.summary

const fieldLabels: Record<string, string> = {
  title: 'Description',
  name: 'Name',
  amount: 'Amount',
  estimated_price: 'Estimated price',
  saved_amount: 'Saved',
  spent_at: 'Date',
  submitted_at: 'Submitted',
  target_date: 'Target date',
  category: 'Category',
  payment_method: 'Payment',
  payment_account: 'Account',
  bank: 'Bank',
  archived: 'Hidden',
  paid_by: 'Paid by',
  claimant: 'Claimed by',
  status: 'Status',
  priority: 'Priority',
  notes: 'Notes',
  url: 'Link',
  receipt: 'Receipt',
  email: 'Email',
  password: 'Password',
}

export const fieldLabel = (field: string) => fieldLabels[field] ?? field.replace(/_/g, ' ')

const money = new Set(['amount', 'estimated_price', 'saved_amount'])
const dates = new Set(['spent_at', 'submitted_at', 'target_date'])

/** One side of a change, shown the way the rest of the app shows it. */
export function formatValue(subject: ActivitySubject, field: string, value: unknown, catalog: CatalogHelpers): string {
  if (value === null || value === undefined || value === '') return '—'
  const v = String(value)
  if (money.has(field)) return formatCurrency(Number(value))
  if (dates.has(field)) return formatDate(v)
  if (field === 'receipt') return value ? 'attached' : 'none'
  if (field === 'archived') return value ? 'yes' : 'no'
  if (field === 'category') return catalog.categoryName(v)
  if (field === 'payment_method') return catalog.methodName(v)
  // Older entries call the account "bank".
  if (field === 'payment_account' || field === 'bank') return catalog.accountName(v)
  const lookup: Record<string, Record<string, string>> = {
    priority: priorityLabels,
    status: subject === 'wishlist_item' ? wishlistStatusLabels : reimbursementStatusLabels,
  }
  return lookup[field]?.[v] ?? v
}

/** Local calendar day of an entry, for grouping. */
export const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA')

export function dayLabel(key: string, todayKey: string, yesterdayKey: string) {
  if (key === todayKey) return 'Today'
  if (key === yesterdayKey) return 'Yesterday'
  return formatDate(key, { weekday: 'long' })
}

export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-ID', { hour: '2-digit', minute: '2-digit' })
