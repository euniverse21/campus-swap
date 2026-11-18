// One place for every call to the backend:
// adds the base URL, the student's token, and turns errors into exceptions.

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5066'
const TOKEN_KEY = 'campusSwap.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage can be unavailable (e.g. private mode); the app still works for browsing
  }
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)

  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  // FormData (photo uploads) sets its own Content-Type with the boundary
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const problem = await response.json()
      message = problem.title ?? message
    } catch {
      // Empty or non-JSON error body: keep the default message
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
