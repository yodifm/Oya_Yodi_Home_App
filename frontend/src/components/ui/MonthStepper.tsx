import { currentMonth, formatMonth, shiftMonth } from '../../lib/format'

/** ‹ October 2026 › — steps one month at a time, never into the future. */
export function MonthStepper({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const step =
    'grid size-11 touch-manipulation place-items-center rounded-md text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-accent disabled:pointer-events-none disabled:opacity-30'
  return (
    // Full width on phones (big tap targets at both ends), compact from `sm`.
    <div className="flex w-full items-center justify-between gap-1 rounded-md border border-border bg-card shadow-sm sm:inline-flex sm:w-auto sm:justify-start">
      <button type="button" className={step} onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month">
        ‹
      </button>
      <span className="min-w-36 flex-1 text-center font-display italic sm:flex-none" aria-live="polite">
        {formatMonth(month)}
      </span>
      <button
        type="button"
        className={step}
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={month >= currentMonth()}
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  )
}
