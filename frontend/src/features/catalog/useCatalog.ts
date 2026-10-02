import { createContext, useContext, useMemo } from 'react'
import type { Option } from '../../components/ui/Field'
import type { Catalog, CatalogItem } from '../../types'

export interface CatalogContextValue {
  catalog: Catalog
  /** Re-fetch after the lists were edited. */
  refresh: () => Promise<void>
}

export const CatalogContext = createContext<CatalogContextValue | null>(null)

/** "line_bank" → "Line Bank": a readable fallback for a key the catalog no longer has. */
const fallbackName = (key: string) => key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const nameOf = (items: CatalogItem[], key: string) => items.find((i) => i.key === key)?.name ?? fallbackName(key)

/**
 * Options for a picker: the active items, plus `current` when it has been
 * hidden since — so editing an old record shows its value instead of a blank.
 */
const pickerOptions = (items: CatalogItem[], current?: string | null): Option[] =>
  items
    .filter((i) => !i.archived || i.key === current)
    .map((i) => ({ value: i.key, label: i.archived ? `${i.name} (hidden)` : i.name }))

/** The household's categories and payment methods, with lookups for display and pickers. */
export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used inside <CatalogProvider>')
  const { catalog, refresh } = ctx

  return useMemo(() => {
    const { categories, payment_methods: methods } = catalog
    const allAccounts = methods.flatMap((m) => m.accounts)
    const activeAccounts = (method: string) => methods.find((m) => m.key === method)?.accounts.filter((a) => !a.archived) ?? []
    const firstActive = (items: CatalogItem[], preferred: string) =>
      items.find((i) => i.key === preferred && !i.archived)?.key ?? items.find((i) => !i.archived)?.key ?? ''

    return {
      catalog,
      refresh,
      categoryName: (key: string) => nameOf(categories, key),
      accountName: (key: string) => nameOf(allAccounts, key),
      methodName: (key: string) => nameOf(methods, key),
      /** "Cash", or "Bank Transfer · BCA" when an account was recorded. */
      paymentName: (method: string, account: string | null) =>
        account ? `${nameOf(methods, method)} · ${nameOf(allAccounts, account)}` : nameOf(methods, method),
      categoryOptions: (current?: string | null) => pickerOptions(categories, current),
      methodOptions: (current?: string | null) => pickerOptions(methods, current),
      /** The method's accounts to choose from; empty when the method has none. */
      accountOptions: (method: string, current?: string | null) =>
        pickerOptions(
          methods.find((m) => m.key === method)?.accounts ?? [],
          current,
        ),
      /** Whether an expense paid this way must say which account. */
      needsAccount: (method: string) => activeAccounts(method).length > 0,
      /** Filters also offer hidden categories, so their history stays findable. */
      categoryFilterOptions: [
        { value: '', label: 'All categories' },
        ...categories.map((c) => ({ value: c.key, label: c.archived ? `${c.name} (hidden)` : c.name })),
      ] as Option[],
      defaultCategory: (preferred = '') => firstActive(categories, preferred),
      defaultMethod: (preferred = 'transfer') => firstActive(methods, preferred),
    }
  }, [catalog, refresh])
}

export type CatalogHelpers = ReturnType<typeof useCatalog>
