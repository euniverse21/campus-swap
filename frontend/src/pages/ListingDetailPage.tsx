import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { cancelListing, getListing } from '../api/listings'
import { ITEM_CONDITIONS } from '../api/types'
import type { ListingDetail } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { ListingOffersSection } from '../components/ListingOffersSection'
import './ListingDetailPage.css'

interface LoadResult {
  id: number
  listing: ListingDetail | null
  error?: string
}

export function ListingDetailPage() {
  const { student } = useAuth()
  const params = useParams()
  const id = Number(params.id)

  const [result, setResult] = useState<LoadResult | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Reload when the id changes, or when the student signs in/out (isMine depends on it)
  useEffect(() => {
    let cancelled = false

    getListing(id)
      .then((listing) => {
        if (!cancelled) setResult({ id, listing })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof ApiError && err.status === 404
            ? 'This listing does not exist.'
            : err instanceof Error
              ? err.message
              : 'Something went wrong.'
        setResult({ id, listing: null, error: message })
      })

    return () => {
      cancelled = true
    }
  }, [id, student?.id])

  async function handleCancel() {
    if (!result?.listing) return
    setActionError(null)
    setIsCancelling(true)
    try {
      await cancelListing(result.listing.id)
      setResult({ ...result, listing: { ...result.listing, status: 'Cancelled' } })
      setIsConfirmingCancel(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not cancel the listing.')
    } finally {
      setIsCancelling(false)
    }
  }

  // The saved result belongs to another id (or nothing loaded yet): still loading
  if (!result || result.id !== id) return <p className="page-message">Loading…</p>

  if (!result.listing) {
    return (
      <main className="page">
        <p className="page-message">{result.error}</p>
        <p className="page-message">
          <Link to="/">← Back to all items</Link>
        </p>
      </main>
    )
  }

  const listing = result.listing
  const photos = listing.item.photoUrls
  const currentPhoto = photos[Math.min(photoIndex, photos.length - 1)]
  const conditionLabel =
    ITEM_CONDITIONS.find((c) => c.value === listing.item.condition)?.label ?? listing.item.condition

  return (
    <main className="page">
      <Link to="/" className="back-link">
        ← All items
      </Link>

      <div className="listing-detail">
        <section className="listing-detail__gallery">
          <div className="listing-detail__main-photo">
            {currentPhoto ? <img src={currentPhoto} alt={listing.item.name} /> : <span>No photo</span>}
          </div>
          {photos.length > 1 && (
            <div className="listing-detail__thumbs">
              {photos.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  className={index === photoIndex ? 'is-active' : ''}
                  onClick={() => setPhotoIndex(index)}
                  aria-label={`Show photo ${index + 1}`}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="listing-detail__info">
          {listing.status !== 'Open' && (
            <p className={`status-badge status-badge--${listing.status.toLowerCase()}`}>
              {listing.status}
            </p>
          )}

          <span className="item-card__category">{listing.item.category}</span>
          <h1>{listing.item.name}</h1>
          <p className="listing-detail__meta">
            {conditionLabel} · listed by <strong>{listing.owner.displayName}</strong>
            {listing.pendingOfferCount > 0 &&
              ` · ${listing.pendingOfferCount} offer${listing.pendingOfferCount === 1 ? '' : 's'}`}
          </p>

          <div className="listing-detail__wanted">
            <h2>Wants in return</h2>
            <p>{listing.wantedDescription}</p>
          </div>

          {listing.item.description && (
            <div className="listing-detail__section">
              <h2>Description</h2>
              <p>{listing.item.description}</p>
            </div>
          )}

          {listing.meetingLocation && (
            <div className="listing-detail__section">
              <h2>Where to meet</h2>
              <p>{listing.meetingLocation}</p>
            </div>
          )}

          {actionError && <p className="form-error">{actionError}</p>}

          <div className="listing-detail__actions">
            {listing.isMine ? (
              listing.status === 'Open' &&
              (isConfirmingCancel ? (
                <div className="confirm-box">
                  <p>Cancel this listing? Pending offers will be rejected.</p>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling…' : 'Yes, cancel it'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setIsConfirmingCancel(false)}
                  >
                    Keep it
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setIsConfirmingCancel(true)}
                >
                  Cancel listing
                </button>
              ))
            ) : student ? (
              <ListingOffersSection listing={listing} />
            ) : (
              <Link
                to={`/verify?next=${encodeURIComponent(`/listings/${listing.id}`)}`}
                className="btn btn--primary btn--block"
              >
                Verify your student email to make an offer
              </Link>
            )}
          </div>
        </section>
      </div>

      {/* The owner sees all offers below the listing. "key" reloads them after cancelling. */}
      {listing.isMine && <ListingOffersSection key={listing.status} listing={listing} />}
    </main>
  )
}
