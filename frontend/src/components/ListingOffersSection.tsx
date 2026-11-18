import { useEffect, useState } from 'react'
import { getOffersForListing, withdrawOffer } from '../api/offers'
import type { ListingDetail, Offer } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { OfferCard } from './OfferCard'
import { OfferForm } from './OfferForm'
import './Offers.css'

interface LoadResult {
  key: string
  offers: Offer[]
  error?: string
}

// Offers on one listing.
// Owner: sees every offer. Other students: see their own offer, or a button to make one.
export function ListingOffersSection({ listing }: { listing: ListingDetail }) {
  const { student } = useAuth()
  const [result, setResult] = useState<LoadResult | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const key = `${listing.id}:${student?.id ?? 'guest'}:${reloadCount}`

  useEffect(() => {
    if (!student) return
    let cancelled = false

    getOffersForListing(listing.id)
      .then((offers) => {
        if (!cancelled) setResult({ key, offers })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({ key, offers: [], error: err instanceof Error ? err.message : 'Could not load offers.' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, listing.id, student])

  if (!student) return null

  const reload = () => setReloadCount((n) => n + 1)

  async function handleWithdraw(offerId: number) {
    setActionError(null)
    setWithdrawingId(offerId)
    try {
      await withdrawOffer(offerId)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not withdraw the offer.')
    } finally {
      setWithdrawingId(null)
    }
  }

  if (!result || result.key !== key) return <p className="offers-section__message">Loading offers…</p>
  if (result.error) return <p className="form-error">{result.error}</p>

  // ----- Owner view -----
  if (listing.isMine) {
    const pending = result.offers.filter((o) => o.status === 'Pending')
    const others = result.offers.filter((o) => o.status !== 'Pending')

    return (
      <section className="offers-section">
        <h2>Offers {pending.length > 0 && <span className="offers-section__count">{pending.length}</span>}</h2>

        {result.offers.length === 0 && (
          <p className="offers-section__message">No offers yet. Share your listing with friends!</p>
        )}

        <div className="offers-section__list">
          {pending.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
          {others.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </section>
    )
  }

  // ----- Other students' view -----
  const myPending = result.offers.find((o) => o.status === 'Pending')
  const myPast = result.offers.filter((o) => o !== myPending)

  return (
    <section className="offers-section">
      {actionError && <p className="form-error">{actionError}</p>}

      {myPending ? (
        <>
          <h2>Your offer</h2>
          <OfferCard
            offer={myPending}
            actions={
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => handleWithdraw(myPending.id)}
                disabled={withdrawingId === myPending.id}
              >
                {withdrawingId === myPending.id ? 'Withdrawing…' : 'Withdraw offer'}
              </button>
            }
          />
        </>
      ) : listing.status !== 'Open' ? (
        <p className="offers-section__message">This listing is no longer accepting offers.</p>
      ) : isFormOpen ? (
        <OfferForm
          listingId={listing.id}
          wantedDescription={listing.wantedDescription}
          onSubmitted={() => {
            setIsFormOpen(false)
            reload()
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      ) : (
        <button type="button" className="btn btn--primary btn--block" onClick={() => setIsFormOpen(true)}>
          Make an offer
        </button>
      )}

      {myPast.length > 0 && (
        <details className="offers-section__past">
          <summary>Your previous offers ({myPast.length})</summary>
          <div className="offers-section__list">
            {myPast.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
