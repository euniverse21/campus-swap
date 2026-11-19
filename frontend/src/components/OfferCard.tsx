import type { ReactNode } from 'react'
import type { Offer } from '../api/types'
import { useLanguage } from '../i18n/useLanguage'
import './Offers.css'

interface OfferCardProps {
  offer: Offer
  // Buttons such as "Withdraw" (or "Accept" later) are passed in by the parent
  actions?: ReactNode
}

export function OfferCard({ offer, actions }: OfferCardProps) {
  const { t, tRich } = useLanguage()
  const item = offer.offeredItem

  return (
    <article className={`offer-card offer-card--${offer.status.toLowerCase()}`}>
      <div className="offer-card__photo">
        {item?.photoUrls[0] ? <img src={item.photoUrls[0]} alt={item.name} /> : <span>{t('common.noPhoto')}</span>}
      </div>

      <div className="offer-card__body">
        <div className="offer-card__top">
          <h3>{item?.name ?? t('offerCard.offer')}</h3>
          <span className={`status-badge status-badge--${offer.status.toLowerCase()}`}>{t(`offerStatus.${offer.status}`)}</span>
        </div>

        {item && (
          <p className="offer-card__meta">
            {tRich('offerCard.meta', {
              category: t(`category.${item.category}`),
              condition: t(`condition.${item.condition}`),
              name: <strong>{offer.isMine ? t('offerCard.you') : offer.offeredBy.displayName}</strong>,
            })}
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
