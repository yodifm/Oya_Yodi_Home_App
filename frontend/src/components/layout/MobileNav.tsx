import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { cn } from '../../lib/cn'
import { Modal } from '../ui/Modal'
import { ChevronRight, ExpensesIcon, MoreIcon, OverviewIcon, PlusIcon, WishlistIcon } from './icons'
import { moreItems } from './nav'

/** Compact top bar for phones: wordmark, and the signed-in member (opens More). */
export function MobileTopBar({ onOpenMore }: { onOpenMore: () => void }) {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <p className="font-display text-xl tracking-[-0.01em]">
          Yodi <span className="italic text-accent">&amp;</span> Oya
        </p>
        {user && (
          <button
            type="button"
            onClick={onOpenMore}
            aria-label={`${user.name} — account and more`}
            className="grid size-11 touch-manipulation place-items-center"
          >
            <span className="grid size-9 place-items-center rounded-full border border-accent/40 bg-card font-display text-base italic text-accent">
              {user.name.charAt(0)}
            </span>
          </button>
        )}
      </div>
    </header>
  )
}

function Tab({ to, end, label, icon }: { to: string; end?: boolean; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-1 touch-manipulation flex-col items-center justify-center gap-1 pt-2 transition-colors',
          isActive ? 'text-accent' : 'text-muted-foreground',
        )
      }
    >
      {icon}
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em]">{label}</span>
    </NavLink>
  )
}

/**
 * Thumb-reach navigation for phones. The centre button records an expense from
 * anywhere — the most common thing to do on a phone.
 */
export function MobileTabBar({ onAdd, onOpenMore }: { onAdd: () => void; onOpenMore: () => void }) {
  const { pathname } = useLocation()
  const inMore = moreItems.some((i) => pathname.startsWith(i.to))

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch">
        <Tab to="/" end label="Overview" icon={<OverviewIcon />} />
        <Tab to="/expenses" label="Expenses" icon={<ExpensesIcon />} />
        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Record an expense"
            className="-mt-5 grid size-14 touch-manipulation place-items-center rounded-full bg-accent text-accent-foreground shadow-accent ring-4 ring-background transition-transform active:scale-95"
          >
            <PlusIcon />
          </button>
        </div>
        <Tab to="/wishlist" label="Wishlist" icon={<WishlistIcon />} />
        <button
          type="button"
          onClick={onOpenMore}
          className={cn(
            'flex flex-1 touch-manipulation flex-col items-center justify-center gap-1 pt-2 transition-colors',
            inMore ? 'text-accent' : 'text-muted-foreground',
          )}
        >
          <MoreIcon />
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em]">More</span>
        </button>
      </div>
    </nav>
  )
}

/** Everything not in the tab bar, plus the account and sign-out. */
export function MoreSheet({ open, onClose, todayLabel }: { open: boolean; onClose: () => void; todayLabel: string }) {
  const { user, logout } = useAuth()

  return (
    <Modal open={open} onClose={onClose} eyebrow={todayLabel} title="More">
      <ul className="-mx-2 divide-y divide-border">
        {moreItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 touch-manipulation items-center gap-4 rounded-md px-2 transition-colors hover:bg-muted',
                  isActive && 'text-accent',
                )
              }
            >
              <span className="w-8 font-display text-sm italic text-accent">{item.numeral}</span>
              <span className="flex-1 text-base font-medium">{item.label}</span>
              <span className="text-muted-foreground">
                <ChevronRight />
              </span>
            </NavLink>
          </li>
        ))}
      </ul>

      {user && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-accent/40 bg-card font-display text-lg italic text-accent">
              {user.name.charAt(0)}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose()
              void logout()
            }}
            className="min-h-11 shrink-0 touch-manipulation px-2 text-sm text-muted-foreground underline-offset-4 hover:text-danger hover:underline"
          >
            Sign out
          </button>
        </div>
      )}
    </Modal>
  )
}

/** Brief confirmation above the tab bar after a quick save. */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="status"
      className="animate-fade-in pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-8"
    >
      <p className="rounded-full border border-accent/30 bg-card px-5 py-2.5 text-sm shadow-lg">
        <span aria-hidden className="mr-2 text-success">
          ✓
        </span>
        {message}
      </p>
    </div>
  )
}
