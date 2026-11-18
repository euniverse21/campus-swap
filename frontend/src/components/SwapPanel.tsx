import { useState } from 'react'
import { cancelSwap, confirmSwap } from '../api/offers'
import type { Offer } from '../api/types'
import { ChatBox } from './ChatBox'

interface SwapPanelProps {
  offer: Offer
  role: 'owner' | 'offerer'
  otherName: string
  onChanged: () => void
}

// Everything after an offer is accepted: steps, chat, "We swapped" and "Cancel swap"
export function SwapPanel({ offer, role, otherName, onChanged }: SwapPanelProps) {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [busy, setBusy] = useState<'confirm' | 'cancel' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isCompleted = offer.status === 'Completed'
  const iConfirmed = role === 'owner' ? offer.ownerConfirmedAt !== null : offer.offererConfirmedAt !== null
  const theyConfirmed = role === 'owner' ? offer.offererConfirmedAt !== null : offer.ownerConfirmedAt !== null

  async function run(kind: 'confirm' | 'cancel') {
    setError(null)
    setBusy(kind)
    try {
      if (kind === 'confirm') await confirmSwap(offer.id)
      else await cancelSwap(offer.id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please refresh and try again.')
      setBusy(null)
    }
  }

  return (
    <div className="swap-panel">
      {isCompleted ? (
        <p className="swap-panel__done">✅ Swap completed. Enjoy your new item!</p>
      ) : (
        <ol className="swap-panel__steps">
          <li>Chat with {otherName} and agree on a time and a public place on campus.</li>
          <li>Meet and swap the items.</li>
          <li>
            Both press <strong>We swapped</strong>.{' '}
            {iConfirmed && !theyConfirmed && <em>You confirmed — waiting for {otherName}.</em>}
            {!iConfirmed && theyConfirmed && <em>{otherName} has confirmed — your turn.</em>}
          </li>
        </ol>
      )}

      <ChatBox offerId={offer.id} canSend={!isCompleted} />

      <p className="swap-panel__safety">
        Stay safe: meet in a busy place on campus and don&apos;t share your home address.
      </p>

      {error && <p className="form-error">{error}</p>}

      {!isCompleted && (
        <div className="swap-panel__actions">
          {!iConfirmed && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => run('confirm')}
              disabled={busy !== null}
            >
              {busy === 'confirm' ? 'Saving…' : 'We swapped ✓'}
            </button>
          )}

          {isConfirmingCancel ? (
            <span className="swap-panel__cancel-confirm">
              Cancel this swap? The listing will open again.
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => run('cancel')}
                disabled={busy !== null}
              >
                {busy === 'cancel' ? 'Cancelling…' : 'Yes, cancel swap'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setIsConfirmingCancel(false)}>
                Keep it
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setIsConfirmingCancel(true)}
              disabled={busy !== null}
            >
              Cancel swap
            </button>
          )}
        </div>
      )}
    </div>
  )
}
