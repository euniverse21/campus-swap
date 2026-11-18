import { useEffect, useState } from 'react'
import { acceptOffer, getOffersForListing, rejectOffer, withdrawOffer } from '../api/offers'
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

interface ListingOffersSectionProps {
  listing: ListingDetail
  // Called after an action that changes the listing itself (accept, reject, new offer)
  onListingChanged: () => void
}

type PendingAction = { offerId: number; kind: 'accept' | 'reject' | 'withdraw' }

// Offers on one listing.
// Owner: sees every offer and can accept or reject. Other students: see their own offer, or make one.
export function ListingOffersSection({ listing, onListingChanged }: ListingOffersSectionProps) {
  const { student } = useAuth()
  const [result, setResult] = useState<LoadResult | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [confirmAcceptId, setConfirmAcceptId] = useState<number | null>(null)
  const [busy, setBusy] = useState<PendingAction | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const key = `${listing.id}:${listing.status}:${student?.id ?? 'guest'}:${reloadCount}`

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

  // Runs accept / reject / withdraw, then refreshes the offers and the listing
  async function run(action: PendingAction) {
    setActionError(null)
    setBusy(action)
    try {
      if (action.kind === 'accept') await acceptOffer(action.offerId)
      else if (action.kind === 'reject') await rejectOffer(action.offerId)
      else await withdrawOffer(action.offerId)

      setConfirmAcceptId(null)
      setReloadCount((n) => n + 1)
      onListingChanged()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Something went wrong. Please refresh and try again.')
      setReloadCount((n) => n + 1) // the offer may have changed meanwhile: show the latest state
    } finally {
      setBusy(null)
    }
  }

  const isBusy = (offerId: number, kind: PendingAction['kind']) =>
    busy?.offerId === offerId && busy.kind === kind

  if (!result || result.key !== key) return <p className="offers-section__message">Loading offers…</p>
  if (result.error) return <p className="form-error">{result.error}</p>

  // ----- Owner view -----
  if (listing.isMine) {
    const accepted = result.offers.find((o) => o.status === 'Accepted' || o.status === 'Completed')
    const pending = result.offers.filter((o) => o.status === 'Pending')
    const closed = result.offers.filter((o) => o !== accepted && o.status !== 'Pending')

    return (
      <section className="offers-section">
        {actionError && <p className="form-error">{actionError}</p>}

        {accepted && (
          <div className="offers-section__accepted">
            <h2>Accepted offer</h2>
            <p className="offers-section__message">
              You accepted {accepted.offeredBy.displayName}&apos;s offer. Both items are now reserved.
              Next you&apos;ll be able to chat and arrange the swap.
            </p>
            <OfferCard offer={accepted} />
          </div>
        )}

        {!accepted && (
          <>
            <h2>
              Offers {pending.length > 0 && <span className="offers-section__count">{pending.length}</span>}
            </h2>
            {pending.length === 0 && (
              <p className="offers-section__message">No offers yet. Share your listing with friends!</p>
            )}
          </>
        )}

        <div className="offers-section__list">
          {pending.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              actions={
                listing.status === 'Open' &&
                (confirmAcceptId === offer.id ? (
                  <div className="offers-section__confirm">
                    <span>Accept this offer? Other offers will be declined.</span>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => run({ offerId: offer.id, kind: 'accept' })}
                      disabled={busy !== null}
                    >
                      {isBusy(offer.id, 'accept') ? 'Accepting…' : 'Yes, accept'}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => setConfirmAcceptId(null)}>
                      Not yet
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => setConfirmAcceptId(offer.id)}
                      disabled={busy !== null}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => run({ offerId: offer.id, kind: 'reject' })}
                      disabled={busy !== null}
                    >
                      {isBusy(offer.id, 'reject') ? 'Declining…' : 'Decline'}
                    </button>
                  </>
                ))
              }
            />
          ))}
        </div>

        {closed.length > 0 && (
          <details className="offers-section__past">
            <summary>Declined offers ({closed.length})</summary>
            <div className="offers-section__list">
              {closed.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </details>
        )}
      </section>
    )
  }

  // ----- Other students' view -----
  const myAccepted = result.offers.find((o) => o.status === 'Accepted' || o.status === 'Completed')
  const myPending = result.offers.find((o) => o.status === 'Pending')
  const myPast = result.offers.filter((o) => o !== myPending && o !== myAccepted)

  return (
    <section className="offers-section">
      {actionError && <p className="form-error">{actionError}</p>}

      {myAccepted ? (
        <div className="offers-section__accepted">
          <h2>🎉 Your offer was accepted!</h2>
          <p className="offers-section__message">
            {listing.owner.displayName} accepted your offer. Both items are reserved for this swap.
          </p>
          <OfferCard offer={myAccepted} />
        </div>
      ) : myPending ? (
        <>
          <h2>Your offer</h2>
          <OfferCard
            offer={myPending}
            actions={
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => run({ offerId: myPending.id, kind: 'withdraw' })}
                disabled={busy !== null}
              >
                {isBusy(myPending.id, 'withdraw') ? 'Withdrawing…' : 'Withdraw offer'}
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
            setReloadCount((n) => n + 1)
            onListingChanged()
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
