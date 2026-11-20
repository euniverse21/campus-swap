import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getMyListings } from '../api/listings'
import type { MyListing } from '../api/types'
import { describeError } from '../i18n/describeError'
import type { Translate } from '../i18n/LanguageContext'
import { useLanguage } from '../i18n/useLanguage'
import { EXCHANGE_ICONS } from '../utils/exchangeTypes'
import './MyListingsPage.css'

interface LoadResult {
  listings: MyListing[]
  error?: string
}

// One line that tells the owner what to do next with this listing
function nextStep(listing: MyListing, t: Translate): string {
  const partner = listing.swapPartnerName ?? t('myListings.anotherStudent')
  const count = listing.pendingOfferCount
  switch (listing.status) {
    case 'Open':
      return count === 0
        ? t('myListings.noOffers')
        : t(count === 1 ? 'myListings.waiting.one' : 'myListings.waiting.other', { count })
    case 'Reserved':
      return t('myListings.swapping', { name: partner })
    case 'Completed':
      return t('myListings.swapped', { name: partner })
    default:
      return t('listingStatus.Cancelled')
  }
}

function ListingRow({ listing }: { listing: MyListing }) {
  const { t } = useLanguage()
  const needsAttention =
    (listing.status === 'Open' && listing.pendingOfferCount > 0) || listing.status === 'Reserved'

  return (
    <Link to={`/listings/${listing.id}`} className="my-listing">
      <div className="my-listing__photo">
        {listing.photoUrl ? (
          <img src={listing.photoUrl} alt={listing.name} />
        ) : (
          <span className="exchange-icon" aria-hidden="true">
            {EXCHANGE_ICONS[listing.type]}
          </span>
        )}
      </div>
      <div className="my-listing__body">
        <div className="my-listing__top">
          <strong>{listing.name}</strong>
          <span className={`status-badge status-badge--${listing.status.toLowerCase()}`}>{t(`listingStatus.${listing.status}`)}</span>
        </div>
        <span className={`my-listing__next ${needsAttention ? 'my-listing__next--attention' : ''}`}>
          {nextStep(listing, t)}
        </span>
      </div>
    </Link>
  )
}

export function MyListingsPage() {
  const { t, tRich } = useLanguage()
  const [result, setResult] = useState<LoadResult | null>(null)

  useEffect(() => {
    let cancelled = false

    getMyListings()
      .then((listings) => {
        if (!cancelled) setResult({ listings })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({ listings: [], error: describeError(err, t, 'myListings.loadError') })
        }
      })

    return () => {
      cancelled = true
    }
  }, [t])

  if (!result) return <p className="page-message">{t('common.loading')}</p>

  const active = result.listings.filter((l) => l.status === 'Open' || l.status === 'Reserved')
  const past = result.listings.filter((l) => l.status === 'Completed' || l.status === 'Cancelled')

  return (
    <main className="page page--medium">
      <div className="my-listings__header">
        <h1 className="page-title">{t('nav.myListings')}</h1>
        <Link to="/listings/new" className="btn btn--primary">
          {t('nav.listItem')}
        </Link>
      </div>

      {result.error && <p className="form-error">{result.error}</p>}

      {!result.error && result.listings.length === 0 && (
        <p className="page-message">
          {tRich('myListings.empty', {
            link: <Link to="/listings/new">{t('myListings.emptyLink')}</Link>,
          })}
        </p>
      )}

      {active.length > 0 && (
        <section className="my-listings__section">
          <h2>{t('myListings.active')}</h2>
          {active.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="my-listings__section">
          <h2>{t('myListings.past')}</h2>
          {past.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </main>
  )
}
