import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useAuth } from './useAuth'

/** Gate for the admin area: guests go to /login and come back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, retry } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <LoadingState label="Opening the book" />
      </div>
    )
  }

  if (status === 'offline') {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <ErrorState message="The server could not be reached. You are still signed in — try again in a moment." onRetry={retry} />
      </div>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return children
}
