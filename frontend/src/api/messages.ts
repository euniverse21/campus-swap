import { apiFetch } from './client'
import type { ChatMessage } from './types'

// afterId: only messages newer than this one (used for polling)
export function getMessages(offerId: number, afterId = 0): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(`/api/offers/${offerId}/messages?afterId=${afterId}`)
}

export function sendMessage(offerId: number, body: string): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(`/api/offers/${offerId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}
