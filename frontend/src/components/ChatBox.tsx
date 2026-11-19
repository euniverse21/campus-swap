import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getMessages, sendMessage } from '../api/messages'
import type { ChatMessage } from '../api/types'
import { describeError } from '../i18n/describeError'
import { useLanguage } from '../i18n/useLanguage'

const POLL_INTERVAL_MS = 5000

// Adds new messages to the list, skipping any we already have (two polls can overlap)
function merge(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const known = new Set(current.map((m) => m.id))
  const added = incoming.filter((m) => !known.has(m.id))
  return added.length === 0 ? current : [...current, ...added].sort((a, b) => a.id - b.id)
}

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface ChatBoxProps {
  offerId: number
  canSend: boolean
}

// Simple chat: loads messages, then asks for new ones every 5 seconds
export function ChatBox({ offerId, canSend }: ChatBoxProps) {
  const { t, locale } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastIdRef = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    lastIdRef.current = 0

    const poll = () => {
      getMessages(offerId, lastIdRef.current)
        .then((newer) => {
          if (cancelled) return
          if (newer.length > 0) {
            lastIdRef.current = Math.max(lastIdRef.current, newer[newer.length - 1].id)
            setMessages((current) => merge(current, newer))
          }
          setIsLoaded(true)
        })
        .catch(() => {
          // Network hiccup: try again on the next tick
        })
    }

    poll()
    const timer = window.setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [offerId])

  // Keep the newest message in view
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages.length])

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return

    setError(null)
    setIsSending(true)
    try {
      const sent = await sendMessage(offerId, text)
      lastIdRef.current = Math.max(lastIdRef.current, sent.id)
      setMessages((current) => merge(current, [sent]))
      setDraft('')
    } catch (err) {
      setError(describeError(err, t, 'chat.sendError'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="chat">
      <div className="chat__messages" ref={listRef}>
        {!isLoaded && <p className="chat__empty">{t('chat.loading')}</p>}
        {isLoaded && messages.length === 0 && (
          <p className="chat__empty">{t('chat.empty')}</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`chat__message ${m.isMine ? 'chat__message--mine' : ''}`}>
            <div className="chat__bubble">{m.body}</div>
            <span className="chat__meta">
              {m.isMine ? t('chat.you') : m.senderName} · {formatTime(m.sentAt, locale)}
            </span>
          </div>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      {canSend && (
        <form className="chat__form" onSubmit={handleSend}>
          <input
            value={draft}
            maxLength={2000}
            placeholder={t('chat.placeholder')}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={t('chat.label')}
          />
          <button type="submit" className="btn btn--primary" disabled={isSending || !draft.trim()}>
            {t('chat.send')}
          </button>
        </form>
      )}
    </div>
  )
}
