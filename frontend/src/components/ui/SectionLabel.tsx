import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Editorial label flanked by hairline rules. `align="start"` drops the leading rule. */
export function SectionLabel({
  children,
  align = 'center',
  className,
}: {
  children: ReactNode
  align?: 'center' | 'start'
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {align === 'center' && <span className="h-px flex-1 bg-border" />}
      <span className="small-caps text-accent">{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
