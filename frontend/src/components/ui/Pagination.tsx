import type { Paginated } from '../../types'

const step =
  'min-h-11 touch-manipulation rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-accent disabled:pointer-events-none disabled:opacity-30'

/** "21–40 of 87 · ‹ Previous  Page 2 of 5  Next ›" — sits under a list card. */
export function Pagination({ meta, onPage }: { meta: Paginated<unknown>['meta']; onPage: (page: number) => void }) {
  if (meta.last_page <= 1) return null

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t border-border px-6 py-4 sm:flex-row sm:px-8"
    >
      <p className="small-caps text-muted-foreground">
        {meta.from}–{meta.to} of {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={step} disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>
          ‹ Previous
        </button>
        <span className="px-2 font-display text-sm italic" aria-current="page">
          Page {meta.current_page} of {meta.last_page}
        </span>
        <button type="button" className={step} disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>
          Next ›
        </button>
      </div>
    </nav>
  )
}
