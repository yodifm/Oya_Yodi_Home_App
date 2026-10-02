import { receipts } from './api'

export type ReceiptOwner = 'expenses' | 'reimbursements'

// No HEIC: browsers can't display it, and iPhones convert photos to JPEG on upload anyway.
export const RECEIPT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024

/** What the form wants done with the receipt when it saves. */
export type ReceiptChange = { kind: 'keep' } | { kind: 'replace'; file: File } | { kind: 'remove' }

/** Apply a ReceiptChange after the record is saved (it needs the record's id). */
export function applyReceiptChange(type: ReceiptOwner, id: number, change: ReceiptChange) {
  if (change.kind === 'replace') return receipts.upload(type, id, change.file)
  if (change.kind === 'remove') return receipts.remove(type, id)
  return Promise.resolve()
}
