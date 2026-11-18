import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, getToken, setToken } from '../api/client'
import type { Student } from '../api/types'
import { getMe, logout } from '../api/verification'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null)
  const [isChecking, setIsChecking] = useState(() => getToken() !== null)

  // On app start: if a token is saved, ask the API who it belongs to
  useEffect(() => {
    if (!getToken()) return
    let cancelled = false

    getMe()
      .then((me) => {
        if (!cancelled) setStudent(me)
      })
      .catch((err: unknown) => {
        // Expired or invalid token: forget it so the student can verify again
        if (err instanceof ApiError && err.status === 401) setToken(null)
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback((token: string, me: Student) => {
    setToken(token)
    setStudent(me)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } catch {
      // Token may already be invalid; we clear it locally either way
    }
    setToken(null)
    setStudent(null)
  }, [])

  const value = useMemo(
    () => ({ student, isChecking, signIn, signOut }),
    [student, isChecking, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
