import { api, resource } from '../../lib/api'
import type { BadgeTone } from '../../components/ui/Badge'
import type { Bank, ExpenseCategory, PaymentMethod, WishlistItem, WishlistPriority, WishlistStatus } from '../../types'

// Set by the server, never by the edit form: the purchase link and who added it.
export type WishlistInput = Omit<WishlistItem, 'id' | 'expense_id' | 'created_by' | 'created_at'>

export const wishlistApi = resource<WishlistItem, WishlistInput>('wishlist')

export interface PurchaseInput {
  amount: number
  category: ExpenseCategory
  spent_at: string
  payment_method: PaymentMethod
  bank: Bank | null
  paid_by: string
}

/** Mark as purchased and record the expense in one step. */
export const purchaseItem = (id: number, input: PurchaseInput) =>
  api.request<{ data: WishlistItem }>(`/wishlist/${id}/purchase`, { method: 'POST', body: JSON.stringify(input) })

export const priorityTone: Record<WishlistPriority, BadgeTone> = {
  high: 'accent',
  medium: 'neutral',
  low: 'neutral',
}

export const wishlistStatusTone: Record<WishlistStatus, BadgeTone> = {
  wanted: 'neutral',
  saving: 'info',
  purchased: 'success',
}

export const progressOf = (item: WishlistItem) =>
  item.estimated_price > 0 ? Math.min(1, item.saved_amount / item.estimated_price) : 0
