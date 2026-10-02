import type { ChangeEvent } from 'react'

/** "1500000" → "1.500.000" (Indonesian thousands separator). */
export const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/**
 * Props for a rupiah amount <input>: it shows "199.000" while typing and hands
 * back the bare digits ("199000"). The caret stays next to the digit it was
 * beside, so editing in the middle doesn't jump to the end as dots come and go.
 */
export function moneyInputProps(digits: string, onDigits: (digits: string) => void) {
  return {
    type: 'text',
    inputMode: 'numeric' as const,
    autoComplete: 'off',
    value: groupThousands(digits),
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target
      const caret = input.selectionStart ?? input.value.length
      const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, '').length
      // Digits only, no leading zeros, and short of what a JS number holds exactly.
      const next = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 15)
      onDigits(next)

      requestAnimationFrame(() => {
        if (document.activeElement !== input) return
        const shown = groupThousands(next)
        let pos = 0
        for (let seen = 0; pos < shown.length && seen < digitsBeforeCaret; pos++) {
          if (shown[pos] !== '.') seen++
        }
        input.setSelectionRange(pos, pos)
      })
    },
  }
}
