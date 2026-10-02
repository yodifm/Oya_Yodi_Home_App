const idr = new Intl.NumberFormat('en-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const compact = new Intl.NumberFormat('en-ID', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatCurrency = (value: number) => idr.format(value)

/** Short axis-friendly money: "Rp 1.2M". */
export const formatCompact = (value: number) => `Rp ${compact.format(value)}`

export function formatDate(iso: string | null, opts: Intl.DateTimeFormatOptions = {}) {
  if (!iso) return '—'
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  })
}

/** "2026-10" → "October 2026" (or "Oct" with short=true). */
export function formatMonth(ym: string, short = false) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-ID', {
    month: short ? 'short' : 'long',
    year: short ? undefined : 'numeric',
  })
}

// Local date, not UTC — toISOString() would roll back a day before 07:00 WIB.
export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const currentMonth = () => today().slice(0, 7)
export const currentYear = () => Number(today().slice(0, 4))

export function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
