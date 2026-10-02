import { useCallback, useEffect, useState } from 'react'
import type { DependencyList } from 'react'
import { onDataChanged } from '../lib/events'

interface AsyncState<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  reload: () => void
}

/** Run an async loader on mount and whenever `deps` change. Stale responses are dropped. */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loader()
      .then((result) => !cancelled && setData(result))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  // Refresh when something elsewhere in the app saved data (see lib/events).
  useEffect(() => onDataChanged(reload), [reload])

  return { data, loading, error, reload }
}
