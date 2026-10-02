import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ApiError, setUnauthorizedHandler } from '../../lib/api'
import { getToken, setToken } from '../../lib/token'
import type { User } from '../../types'
import { AuthContext } from './useAuth'
import type { AuthState } from './useAuth'

const fetchMembers = () => api.request<{ data: User[] }>('/members').then((r) => r.data)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>(() => (getToken() ? 'loading' : 'guest'))
  const [user, setUser] = useState<User | null>(null)
  const [members, setMembers] = useState<User[]>([])

  const reset = useCallback(() => {
    setUser(null)
    setMembers([])
    setStatus('guest')
  }, [])

  // Any 401 from the API (expired/revoked token) drops back to the login page.
  useEffect(() => setUnauthorizedHandler(reset), [reset])

  // Restore a saved session on first load.
  useEffect(() => {
    if (status !== 'loading') return
    Promise.all([api.request<{ user: User }>('/me'), fetchMembers()])
      .then(([me, list]) => {
        setUser(me.user)
        setMembers(list)
        setStatus('authenticated')
      })
      // A 401 has already signed us out (see api.ts). Anything else — backend
      // restarting, no signal — keeps the token so a retry can pick it up.
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) setStatus('offline')
      })
  }, [status, reset])

  const retry = useCallback(() => setStatus(getToken() ? 'loading' : 'guest'), [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.request<{ token: string; user: User }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(res.token)
    setMembers(await fetchMembers())
    setUser(res.user)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await api.request('/logout', { method: 'POST' }).catch(() => {})
    setToken(null)
    reset()
  }, [reset])

  // After users are added/renamed: refresh the dropdown options and, in case
  // the signed-in user edited themselves, their own name and email.
  const refresh = useCallback(async () => {
    const [me, list] = await Promise.all([api.request<{ user: User }>('/me'), fetchMembers()])
    setUser(me.user)
    setMembers(list)
  }, [])

  const value = useMemo(
    () => ({ status, user, members, login, logout, refresh, retry }),
    [status, user, members, login, logout, refresh, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
