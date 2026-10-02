import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

// Tighter on phones so narrow tables fit without sideways scrolling.
const edge = 'first:pl-4 last:pr-4 sm:first:pl-8 sm:last:pr-8'

/** Editorial table: hairline row rules, mono heads, no vertical lines. */
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-left text-sm', className)} {...props} />
    </div>
  )
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'small-caps whitespace-nowrap border-b border-border px-3 py-4 text-muted-foreground sm:px-4',
        edge,
        className,
      )}
      {...props}
    />
  )
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('border-b border-border px-3 py-4 align-middle sm:px-4', edge, className)}
      {...props}
    />
  )
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-150 hover:bg-muted/40 [&:last-child>td]:border-b-0',
        className,
      )}
      {...props}
    />
  )
}
