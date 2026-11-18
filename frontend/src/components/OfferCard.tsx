import type { ReactNode } from 'react'
import { ITEM_CONDITIONS } from '../api/types'
import type { Offer } from '../api/types'
import './Offers.css'

interface OfferCardProps {
  offer: Offer
  // Buttons such as "Withdraw" (or "Accept" later) are passed in by the parent
  actions?: ReactNode
}

export function OfferCard({ offer, actions }: OfferCardProps) {
  const item = offer.offeredItem
  const conditionLabel = ITEM_CONDITIONS.find((c) => c.value === item?.condition)?.label ?? item?.condition

  return (
    <article className={`offer-card offer-card--${offer.status.toLowerCase()}`}>
      <div className="offer-card__photo">
        {item?.photoUrls[0] ? <img src={item.photoUrls[0]} alt={item.name} /> : <span>No photo</span>}
      </div>

      <div className="offer-card__body">
        <div className="offer-card__top">
          <h3>{item?.name ?? 'Offer'}</h3>
          <span className={`status-badge status-badge--${offer.status.toLowerCase()}`}>{offer.status}</span>
        </div>

        {item && (
          <p className="offer-card__meta">
            {item.category} · {conditionLabel} · from <strong>{offer.isMine ? 'you' : offer.offeredBy.displayName}</strong>
          </p>
        )}

        {item?.description && <p className="offer-card__description">{item.description}</p>}
        {offer.message && <p className="offer-card__message">“{offer.message}”</p>}

        {item && item.photoUrls.length > 1 && (
          <div className="offer-card__thumbs">
            {item.photoUrls.slice(1).map((url) => (
              <img key={url} src={url} alt="" />
            ))}
          </div>
        )}

        {actions && <div className="offer-card__actions">{actions}</div>}
      </div>
    </article>
  )
}
