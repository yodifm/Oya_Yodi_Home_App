const KEY = 'household-ledger:token'

// Storage can throw (private mode, blocked site data) — treat that as "no token".
export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(KEY, token)
    else localStorage.removeItem(KEY)
  } catch {
    // Session simply won't survive a reload.
  }
}
