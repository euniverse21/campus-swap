import { createContext } from 'react'
import type { Student } from '../api/types'

export interface AuthState {
  // The verified student on this browser, or null for visitors
  student: Student | null
  // True while we check a saved token with the API on app start
  isChecking: boolean
  signIn: (token: string, student: Student) => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
