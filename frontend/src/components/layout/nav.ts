/** Site map, shared by the desktop sidebar and the mobile tab bar / More sheet. */
export type NavItem = { to: string; label: string; numeral: string; end?: boolean }

export const contents: NavItem[] = [
  { to: '/', label: 'Overview', numeral: 'I', end: true },
  { to: '/expenses', label: 'Expenses', numeral: 'II' },
  { to: '/reimbursements', label: 'Reimbursements', numeral: 'III' },
  { to: '/wishlist', label: 'Wishlist', numeral: 'IV' },
]

export const planning: NavItem[] = [
  { to: '/budgets', label: 'Budgets', numeral: 'V' },
  { to: '/reports', label: 'Reports', numeral: 'VI' },
]

export const household: NavItem[] = [
  { to: '/categories', label: 'Categories & Payments', numeral: 'VII' },
  { to: '/users', label: 'Users', numeral: 'VIII' },
  { to: '/activity', label: 'Activity', numeral: 'IX' },
]

/** Pages reached through "More" on phones (everything not in the tab bar). */
export const moreItems: NavItem[] = [contents[2], ...planning, ...household]
