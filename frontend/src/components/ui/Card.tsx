import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 2px gold rule along the top edge. */
  accentTop?: boolean
  hoverEffect?: boolean
  elevated?: boolean
  /** Gold-tinted surface for the one thing that matters most on a page. */
  featured?: boolean
}

export function Card({ accentTop, hoverEffect, elevated, featured, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border transition-all duration-200 ease-out',
        featured ? 'bg-accent-muted' : 'bg-card',
        elevated ? 'shadow-md' : 'shadow-sm',
        (accentTop || featured) && 'border-t-2 border-t-accent',
        hoverEffect && 'hover:border-border-hover hover:bg-muted/30 hover:shadow-md',
        className,
      )}
      {...props}
    />
  )
}
