import { cn } from '../../lib/cn'

export interface TabItem<T extends string> {
  value: T
  label: string
  count?: number
}

/** Editorial filter tabs: text with a gold underline for the active one. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 touch-manipulation items-center gap-2 border-b-2 px-3 text-sm font-medium tracking-[0.05em] transition-colors duration-200',
              active ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn('font-mono text-xs', active ? 'text-accent' : 'text-muted-foreground/70')}>
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
