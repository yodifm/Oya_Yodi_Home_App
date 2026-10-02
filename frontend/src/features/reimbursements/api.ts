import { resource } from '../../lib/api'
import type { BadgeTone } from '../../components/ui/Badge'
import type { Reimbursement, ReimbursementStatus } from '../../types'

// settled_at is derived server-side from status; the receipt is managed separately.
export type ReimbursementInput = Omit<Reimbursement, 'id' | 'settled_at' | 'has_receipt'>

/** Count and total per status across all claims, independent of tab/page. */
export type ReimbursementSummary = Record<ReimbursementStatus, { count: number; total: number }>

export const reimbursementsApi = resource<Reimbursement, ReimbursementInput, ReimbursementSummary>('reimbursements')

export const statusTone: Record<ReimbursementStatus, BadgeTone> = {
  pending: 'accent',
  approved: 'info',
  paid: 'success',
  rejected: 'danger',
}

/** The single next step in a claim's life, if any. */
export const nextStep: Partial<Record<ReimbursementStatus, { to: ReimbursementStatus; label: string }>> = {
  pending: { to: 'approved', label: 'Approve' },
  approved: { to: 'paid', label: 'Mark as paid' },
}

export function toInput({ id: _id, settled_at: _s, has_receipt: _r, ...rest }: Reimbursement): ReimbursementInput {
  return rest
}
