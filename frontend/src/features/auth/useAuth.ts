import { createContext, useContext } from 'react'
import type { User } from '../../types'

export interface AuthState {
  /** offline: a session is saved but the server could not be reached. */
  status: 'loading' | 'authenticated' | 'guest' | 'offline'
  user: User | null
  /** Everyone who can be a payer/claimant — drives the Yodi / Oya dropdowns. */
  members: User[]
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Re-fetch the signed-in user and member list (after user management changes). */
  refresh: () => Promise<void>
  /** Try restoring the saved session again (after 'offline'). */
  retry: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** Member dropdown options plus a sensible default: whoever is signed in. */
export function useMemberOptions() {
  const { user, members } = useAuth()
  return {
    options: members.map((m) => ({ value: m.name, label: m.name })),
    defaultName: user?.name ?? members[0]?.name ?? '',
  }
}
