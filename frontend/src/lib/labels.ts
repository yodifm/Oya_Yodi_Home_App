import type {
  Bank,
  ExpenseCategory,
  PaymentMethod,
  ReimbursementStatus,
  WishlistPriority,
  WishlistStatus,
} from '../types'

export const categoryLabels: Record<ExpenseCategory, string> = {
  groceries: 'Groceries',
  food: 'Food',
  utilities: 'Utilities',
  transport: 'Transport',
  household: 'Household Supplies',
  health: 'Health',
  education: 'Education',
  entertainment: 'Entertainment',
  other: 'Other',
}

export const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  transfer: 'Bank Transfer',
  'e-wallet': 'E-Wallet',
}

export const bankLabels: Record<Bank, string> = {
  bca: 'BCA',
  line_bank: 'Line Bank',
  mandiri: 'Mandiri',
}

/** "Transfer · BCA" for a transfer with a known bank, otherwise the method ("Cash", "Bank Transfer"). */
export const paymentDisplay = (method: PaymentMethod, bank: Bank | null) =>
  method === 'transfer' && bank ? `Transfer · ${bankLabels[bank]}` : paymentLabels[method]

/** The bank to send: only for transfers, otherwise null. */
export const bankForSubmit = (method: PaymentMethod, bank: Bank | '') => (method === 'transfer' && bank ? bank : null)

export const reimbursementStatusLabels: Record<ReimbursementStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected',
}

export const wishlistStatusLabels: Record<WishlistStatus, string> = {
  wanted: 'Wanted',
  saving: 'Saving',
  purchased: 'Purchased',
}

export const priorityLabels: Record<WishlistPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

/** Turn a label map into <Select> options. */
export const toOptions = <K extends string>(map: Record<K, string>) =>
  (Object.entries(map) as [K, string][]).map(([value, label]) => ({ value, label }))

/** Category picker for filters: "All categories" (empty value) plus every category. */
export const categoryFilterOptions = [{ value: '', label: 'All categories' }, ...toOptions(categoryLabels)]
