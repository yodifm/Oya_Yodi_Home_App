import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-foreground shadow-sm hover:bg-accent-secondary hover:shadow-accent hover:-translate-y-0.5 active:translate-y-0',
  outline:
    'border border-foreground text-foreground hover:bg-muted hover:border-accent hover:text-accent',
  ghost:
    'text-muted-foreground hover:text-foreground hover:underline decoration-accent underline-offset-4',
  danger: 'border border-danger/40 text-danger hover:bg-danger-muted hover:border-danger',
}

const sizes: Record<Size, string> = {
  // Full 44px touch target on phones; compact from sm up where a mouse is likely.
  sm: 'min-h-11 px-3 text-sm sm:min-h-9',
  md: 'min-h-11 px-5 text-sm',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex touch-manipulation items-center justify-center gap-2 rounded-md font-medium tracking-[0.03em] transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
