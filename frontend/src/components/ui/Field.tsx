import { useId } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/cn'

// No width here: each field sets its own (form fields fill their cell, filters size to
// content). With no class merging, a shared w-full would silently beat a filter's w-auto.
const control =
  'rounded-md border border-border bg-transparent px-4 text-base text-foreground transition-all duration-150 ease-out placeholder:text-muted-foreground/60 hover:border-border-hover focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:border-danger'

const chevron = 'appearance-none bg-[url(/chevron.svg)] bg-no-repeat'

export type Option = { value: string; label: string }

interface FieldShellProps {
  label: string
  error?: string
  hint?: string
  className?: string
  children: (id: string, describedBy: string | undefined) => ReactNode
}

function FieldShell({ label, error, hint, className, children }: FieldShellProps) {
  const id = useId()
  const msgId = `${id}-msg`
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="small-caps text-muted-foreground">
        {label}
      </label>
      {children(id, error || hint ? msgId : undefined)}
      {(error || hint) && (
        <p
          id={msgId}
          className={cn('text-sm leading-snug', error ? 'text-danger' : 'text-muted-foreground')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

type Common = { label: string; error?: string; hint?: string; wrapperClassName?: string }

export function TextField({
  label,
  error,
  hint,
  wrapperClassName,
  className,
  ...props
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={wrapperClassName}>
      {(id, describedBy) => (
        <input
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(control, 'h-12 w-full', className)}
          {...props}
        />
      )}
    </FieldShell>
  )
}

export function SelectField({
  label,
  error,
  hint,
  wrapperClassName,
  className,
  options,
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { options: Option[] }) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={wrapperClassName}>
      {(id, describedBy) => (
        <select
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(control, chevron, 'h-12 w-full bg-[right_1rem_center] pr-10', className)}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  )
}

export function TextAreaField({
  label,
  error,
  hint,
  wrapperClassName,
  className,
  ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={wrapperClassName}>
      {(id, describedBy) => (
        <textarea
          id={id}
          rows={3}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(control, 'w-full py-3 leading-relaxed', className)}
          {...props}
        />
      )}
    </FieldShell>
  )
}

/** Compact select for toolbars/filters — same styling, no label chrome. */
export function FilterSelect({
  label,
  options,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: Option[] }) {
  // Sized by its content unless the caller sets a width (no width class here to clash with).
  // 16px text on phones: iOS zooms into any field smaller than that.
  return (
    <select
      aria-label={label}
      className={cn(control, chevron, 'h-11 bg-[right_0.75rem_center] pr-9 text-base sm:text-sm', className)}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
