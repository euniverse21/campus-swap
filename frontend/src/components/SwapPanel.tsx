import { useState } from 'react'
import { cancelSwap, confirmSwap } from '../api/offers'
import type { Offer } from '../api/types'
import { ChatBox } from './ChatBox'
import { describeError } from '../i18n/describeError'
import { useLanguage } from '../i18n/useLanguage'

interface SwapPanelProps {
  offer: Offer
  role: 'owner' | 'offerer'
  otherName: string
  onChanged: () => void
}

// Everything after an offer is accepted: steps, chat, "We swapped" and "Cancel swap"
export function SwapPanel({ offer, role, otherName, onChanged }: SwapPanelProps) {
  const { t, tRich } = useLanguage()
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
      setError(describeError(err, t, 'common.somethingWrongRefresh'))
      setBusy(null)
    }
  }

  return (
    <div className="swap-panel">
      {isCompleted ? (
        <p className="swap-panel__done">{t('swap.done')}</p>
      ) : (
        <ol className="swap-panel__steps">
          <li>{t('swap.step1', { name: otherName })}</li>
          <li>{t('swap.step2')}</li>
          <li>
            {tRich('swap.step3', { button: <strong>{t('swap.weSwapped')}</strong> })}{' '}
            {iConfirmed && !theyConfirmed && <em>{t('swap.waitingForThem', { name: otherName })}</em>}
            {!iConfirmed && theyConfirmed && <em>{t('swap.yourTurn', { name: otherName })}</em>}
          </li>
        </ol>
      )}

      {/* Chat stays open after completion too (e.g. "Thanks!"), matching the API */}
      <ChatBox offerId={offer.id} canSend />

      <p className="swap-panel__safety">
        {t('swap.safety')}
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
              {busy === 'confirm' ? t('swap.saving') : t('swap.weSwappedButton')}
            </button>
          )}

          {isConfirmingCancel ? (
            <span className="swap-panel__cancel-confirm">
              {t('swap.cancelConfirm')}
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => run('cancel')}
                disabled={busy !== null}
              >
                {busy === 'cancel' ? t('swap.cancelling') : t('swap.yesCancel')}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setIsConfirmingCancel(false)}>
                {t('swap.keep')}
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setIsConfirmingCancel(true)}
              disabled={busy !== null}
            >
              {t('swap.cancel')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
