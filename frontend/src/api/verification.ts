import { apiFetch } from './client'
import type { SessionResponse, Student } from './types'

export function requestCode(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/verification/request-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function confirmCode(email: string, code: string, displayName: string): Promise<SessionResponse> {
  return apiFetch<SessionResponse>('/api/verification/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code, displayName: displayName || null }),
  })
}

export function getMe(): Promise<Student> {
  return apiFetch<Student>('/api/verification/me')
}

export function logout(): Promise<void> {
  return apiFetch<void>('/api/verification/logout', { method: 'POST' })
}
