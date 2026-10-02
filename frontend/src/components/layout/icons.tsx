/** Thin-stroke line icons for the mobile tab bar, drawn to match the editorial rule lines. */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  className: 'size-6',
}

/** An open book — the household book's front page. */
export const OverviewIcon = () => (
  <svg {...base}>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" />
    <path d="M12 6.5v13" />
  </svg>
)

/** A receipt with a torn bottom edge. */
export const ExpensesIcon = () => (
  <svg {...base}>
    <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </svg>
)

export const WishlistIcon = () => (
  <svg {...base}>
    <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" />
  </svg>
)

export const MoreIcon = () => (
  <svg {...base}>
    <path d="M4.5 7h15M4.5 12h15M4.5 17h9" />
  </svg>
)

export const PlusIcon = () => (
  <svg {...base} strokeWidth={1.8} className="size-7">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const ChevronRight = () => (
  <svg {...base} className="size-4">
    <path d="m9 6 6 6-6 6" />
  </svg>
)
