import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger' | 'info'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground border-border',
  accent: 'bg-accent-muted text-accent border-accent/30',
  success: 'bg-success-muted text-success border-success/25',
  danger: 'bg-danger-muted text-danger border-danger/25',
  info: 'bg-info-muted text-info border-info/25',
}

/** Status pill. Tone is never the only signal — the label text always carries the meaning. */
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em]',
        tones[tone],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}
