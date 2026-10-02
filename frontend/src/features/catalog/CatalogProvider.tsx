import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ErrorState, LoadingState } from '../../components/ui/States'
import type { Catalog } from '../../types'
import { fetchCatalog } from './api'
import { CatalogContext } from './useCatalog'

/**
 * Loads the categories and payment methods once for the signed-in app; every
 * form, filter and list reads names and options from here.
 */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchCatalog().then(
      (result) => !cancelled && setCatalog(result),
      (e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)),
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  const refresh = useCallback(async () => {
    setCatalog(await fetchCatalog())
  }, [])

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null)
            setAttempt((a) => a + 1)
          }}
        />
      </div>
    )
  }
  if (!catalog) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <LoadingState label="Opening the book" />
      </div>
    )
  }

  return <CatalogContext.Provider value={{ catalog, refresh }}>{children}</CatalogContext.Provider>
}
