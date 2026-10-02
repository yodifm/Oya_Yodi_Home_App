import { cn } from '../../lib/cn'

/**
 * An on/off toggle (role="switch"). The whole row is the tap target, so it is
 * comfortable on a phone; the label and description say what it does.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full touch-manipulation items-center justify-between gap-4 text-left disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative inline-block h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-accent bg-accent' : 'border-border bg-muted',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-[1.125rem] rounded-full bg-card shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}
