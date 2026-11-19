import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useLanguage } from '../i18n/useLanguage'

// Wrap pages that only verified students may use.
// Visitors are sent to /verify and come back here afterwards.
export function RequireStudent({ children }: { children: ReactNode }) {
  const { student, isChecking } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (isChecking) return <p className="page-message">{t('common.loading')}</p>

  if (!student) {
    const next = encodeURIComponent(location.pathname)
    return <Navigate to={`/verify?next=${next}`} replace />
  }

  return children
}
