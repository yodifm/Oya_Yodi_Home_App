import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string
  caption?: ReactNode
  featured?: boolean
  className?: string
}

/**
 * Headline number: mono label, large serif figure, quiet caption.
 * Compact on phones so two fit side by side.
 */
export function StatCard({ label, value, caption, featured, className }: StatCardProps) {
  return (
    <Card featured={featured} accentTop={!featured} className={cn('@container flex flex-col gap-2 p-4 sm:gap-3 sm:p-8', className)}>
      <p className="small-caps text-[0.625rem] text-muted-foreground sm:text-xs">{label}</p>
      {/* Scales with the card (cqi), so long rupiah figures never wrap mid-number. */}
      <p className="figure whitespace-nowrap text-[clamp(1.125rem,11cqi,2.25rem)] leading-none tracking-[-0.02em]">{value}</p>
      {caption && <div className="text-xs text-muted-foreground sm:text-sm">{caption}</div>}
    </Card>
  )
}
