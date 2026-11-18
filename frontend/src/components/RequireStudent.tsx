import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'

// Wrap pages that only verified students may use.
// Visitors are sent to /verify and come back here afterwards.
export function RequireStudent({ children }: { children: ReactNode }) {
  const { student, isChecking } = useAuth()
  const location = useLocation()

  if (isChecking) return <p className="page-message">Loading…</p>

  if (!student) {
    const next = encodeURIComponent(location.pathname)
    return <Navigate to={`/verify?next=${next}`} replace />
  }

  return children
}
