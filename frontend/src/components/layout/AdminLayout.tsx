import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { cn } from '../../lib/cn'
import { MobileTabBar, MobileTopBar, MoreSheet } from './MobileNav'
import { contents, household, planning } from './nav'
import type { NavItem } from './nav'
import { useQuickAddExpense } from './useQuickAddExpense'

const SIDEBAR_KEY = 'yodi-oya:sidebar-open'

/** Desktop sidebar visibility, remembered per browser. Storage failures just mean "open". */
function useSidebarOpen() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) !== 'false'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(open))
    } catch {
      // Preference simply won't persist.
    }
  }, [open])

  return [open, setOpen] as const
}

/** Two-pane icon: the left pane is filled while the sidebar is shown. */
function SidebarIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.25">
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <path d="M7.5 3.5v13" />
      {open && <rect x="2.5" y="3.5" width="5" height="13" rx="2" fill="currentColor" opacity="0.18" stroke="none" />}
    </svg>
  )
}

function Wordmark() {
  return (
    <div className="leading-none">
      <p className="font-display text-2xl tracking-[-0.01em]">
        Yodi <span className="italic text-accent">&amp;</span> Oya
      </p>
      <p className="small-caps mt-2 text-[0.625rem] text-muted-foreground">Our Household Book</p>
    </div>
  )
}

function NavGroup({ title, items, onNavigate }: { title: string; items: NavItem[]; onNavigate?: () => void }) {
  return (
    <div>
      <p className="small-caps mb-4 px-3 text-[0.625rem] text-muted-foreground">{title}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex min-h-11 touch-manipulation items-center gap-4 rounded-md px-3 text-sm font-medium tracking-[0.05em] transition-all duration-200',
                  isActive ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'w-6 font-display text-sm italic transition-colors',
                      isActive ? 'text-accent' : 'text-muted-foreground/60 group-hover:text-accent',
                    )}
                  >
                    {item.numeral}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-8">
      <NavGroup title="Contents" items={contents} onNavigate={onNavigate} />
      <NavGroup title="Planning" items={planning} onNavigate={onNavigate} />
      <NavGroup title="Household" items={household} onNavigate={onNavigate} />
    </nav>
  )
}

/** Signed-in member with a quiet sign-out link. */
function Account() {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full border border-accent/40 bg-card font-display text-base italic text-accent"
        >
          {user.name.charAt(0)}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="min-h-11 shrink-0 touch-manipulation px-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-danger hover:underline"
      >
        Sign out
      </button>
    </div>
  )
}

// No display utility here: each use sets its own (one is hidden on phones).
const toggleButton =
  'size-10 touch-manipulation place-items-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-card hover:text-accent'

export function AdminLayout() {
  const [moreOpen, setMoreOpen] = useState(false)
  const quickAdd = useQuickAddExpense()
  const [sidebarOpen, setSidebarOpen] = useSidebarOpen()
  // Computed once per mount; the sidebar date does not need to tick.
  const [todayLabel] = useState(() =>
    new Date().toLocaleDateString('en-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  )

  return (
    <div className="paper relative min-h-dvh overflow-x-clip">
      {/* Ambient glow — warm atmospheric depth behind everything. */}
      {/* Clipped in its own fixed layer: overflow on an ancestor does not clip fixed children. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-48 -top-48 size-[42rem] rounded-full bg-accent opacity-[0.04] blur-3xl" />
      </div>

      {/* Desktop sidebar — slides out of view when hidden; `inert` keeps it out of the tab order. */}
      <aside
        id="sidebar"
        inert={!sidebarOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-20 hidden w-72 flex-col overflow-y-auto border-r border-border bg-muted/60 px-6 py-10 transition-transform duration-300 ease-out lg:flex',
          !sidebarOpen && '-translate-x-full',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <Wordmark />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Hide sidebar"
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            title="Hide sidebar"
            className={cn(toggleButton, '-mr-2 -mt-2 grid')}
          >
            <SidebarIcon open />
          </button>
        </div>
        <div className="my-10 h-px bg-border" />
        <Navigation />
        <div className="mt-auto space-y-6 border-t border-border pt-6">
          <div>
            <p className="small-caps text-[0.625rem] text-muted-foreground">Today</p>
            <p className="mt-1 font-display text-sm italic">{todayLabel}</p>
          </div>
          <Account />
        </div>
      </aside>

      {/* Shown only while the sidebar is hidden: brings it back. */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Show sidebar"
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          title="Show sidebar"
          className={cn(toggleButton, 'animate-fade-in fixed left-4 top-6 z-30 hidden border border-border bg-card shadow-sm lg:grid')}
        >
          <SidebarIcon open={false} />
        </button>
      )}

      {/* Phones: compact top bar, bottom tab bar with quick-add, and a More sheet. */}
      <MobileTopBar onOpenMore={() => setMoreOpen(true)} />
      <MobileTabBar onAdd={quickAdd.open} onOpenMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} todayLabel={todayLabel} />
      {quickAdd.sheet}

      <main className={cn('relative transition-[padding] duration-300 ease-out', sidebarOpen && 'lg:pl-72')}>
        <div className="pb-tabbar mx-auto max-w-6xl px-4 pt-6 sm:px-8 sm:pt-14 lg:px-12 lg:pt-16">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
