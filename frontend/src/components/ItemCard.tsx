import { Link } from 'react-router'
import type { ListingSummary } from '../api/types'
import { useLanguage } from '../i18n/useLanguage'
import './ItemCard.css'

interface ItemCardProps {
  listing: ListingSummary
}

export function ItemCard({ listing }: ItemCardProps) {
  const { t } = useLanguage()
  const coverPhoto = listing.photoUrls[0]

  return (
    <Link to={`/listings/${listing.id}`} className="item-card">
      <div className="item-card__photo">
        {coverPhoto ? (
          <img src={coverPhoto} alt={listing.name} loading="lazy" />
        ) : (
          <span className="item-card__no-photo">{t('common.noPhoto')}</span>
        )}
      </div>

      <div className="item-card__body">
        <span className="item-card__category">{t(`category.${listing.category}`)}</span>
        <h3 className="item-card__name">{listing.name}</h3>
        <p className="item-card__wanted">
          <span className="item-card__label">{t('itemCard.wants')}</span> {listing.wantedDescription}
        </p>
        <p className="item-card__owner">{t('common.byName', { name: listing.ownerName })}</p>
      </div>
    </Link>
  )
}
