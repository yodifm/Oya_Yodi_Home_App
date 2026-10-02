import { resource } from '../../lib/api'
import type { ManagedUser } from '../../types'

export interface UserInput {
  name: string
  email: string
  /** Required when creating. When editing, null/blank keeps the current password. */
  password: string | null
  password_confirmation: string | null
  /** Household email updates for this person. */
  email_notifications: boolean
}

export const usersApi = resource<ManagedUser, UserInput>('users')
