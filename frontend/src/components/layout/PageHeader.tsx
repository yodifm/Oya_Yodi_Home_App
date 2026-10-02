import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: ReactNode
  description?: string
  actions?: ReactNode
}

/**
 * Editorial masthead: mono eyebrow, oversized serif title, closing hairline rule.
 * Tighter on phones so the page's data starts above the fold.
 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="animate-fade-in mb-6 sm:mb-16">
      <p className="small-caps mb-2 text-accent sm:mb-4">{eyebrow}</p>
      {/* Side by side only from lg: on tablets the title and filters don't both fit on one row. */}
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-[2rem] leading-[1.1] tracking-[-0.02em] sm:text-5xl lg:text-6xl">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted-foreground sm:mt-4 sm:text-lg">{description}</p>}
        </div>
        {actions && <div className="flex w-full shrink-0 flex-wrap gap-3 lg:w-auto">{actions}</div>}
      </div>
      <div className="mt-6 flex items-center gap-3 sm:mt-10">
        <span className="h-px w-12 bg-accent" />
        <span className="h-px flex-1 bg-border" />
      </div>
    </header>
  )
}
