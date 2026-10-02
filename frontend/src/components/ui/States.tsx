import type { ReactNode } from 'react'

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <span aria-hidden className="font-display text-6xl leading-none text-accent/40">
        ❦
      </span>
      <h3 className="mt-6 text-2xl">{title}</h3>
      <p className="mt-2 max-w-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
      <span className="size-1.5 animate-pulse rounded-full bg-accent" />
      <span className="small-caps">{label}…</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <p className="small-caps text-danger">Could not load</p>
      <p className="max-w-md text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 touch-manipulation text-sm text-accent underline underline-offset-4 hover:text-foreground"
        >
          Try again
        </button>
      )}
    </div>
  )
}
