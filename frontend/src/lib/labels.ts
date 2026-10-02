// Categories and payment methods are managed in the app: see features/catalog/useCatalog.
import type { ReimbursementStatus, WishlistPriority, WishlistStatus } from '../types'

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
