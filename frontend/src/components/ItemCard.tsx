import type { ListingSummary } from '../api/types'
import './ItemCard.css'

interface ItemCardProps {
  listing: ListingSummary
}

export function ItemCard({ listing }: ItemCardProps) {
  const coverPhoto = listing.photoUrls[0]

  return (
    <article className="item-card">
      <div className="item-card__photo">
        {coverPhoto ? (
          <img src={coverPhoto} alt={listing.name} loading="lazy" />
        ) : (
          <span className="item-card__no-photo">No photo</span>
        )}
      </div>

      <div className="item-card__body">
        <span className="item-card__category">{listing.category}</span>
        <h3 className="item-card__name">{listing.name}</h3>
        <p className="item-card__wanted">
          <span className="item-card__label">Wants</span> {listing.wantedDescription}
        </p>
        <p className="item-card__owner">by {listing.ownerName}</p>
      </div>
    </article>
  )
}
