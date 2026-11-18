import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getMyOffers, withdrawOffer } from '../api/offers'
import type { SentOffer } from '../api/types'
import { OfferCard } from '../components/OfferCard'
import './MyOffersPage.css'

interface LoadResult {
  version: number
  offers: SentOffer[]
  error?: string
}

// Every offer I have sent, with the listing it was sent to
export function MyOffersPage() {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<LoadResult | null>(null)
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getMyOffers()
      .then((offers) => {
        if (!cancelled) setResult({ version, offers })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({ version, offers: [], error: err instanceof Error ? err.message : 'Could not load offers.' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [version])

  async function handleWithdraw(offerId: number) {
    setActionError(null)
    setWithdrawingId(offerId)
    try {
      await withdrawOffer(offerId)
      setVersion((v) => v + 1)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not withdraw the offer.')
    } finally {
      setWithdrawingId(null)
    }
  }

  return (
    <main className="page page--medium">
      <h1 className="page-title">My offers</h1>
      {actionError && <p className="form-error">{actionError}</p>}

      {!result || result.version !== version ? (
        <p className="page-message">Loading…</p>
      ) : result.error ? (
        <p className="form-error">{result.error}</p>
      ) : result.offers.length === 0 ? (
        <p className="page-message">
          You haven&apos;t sent any offers yet. <Link to="/">Find something to swap →</Link>
        </p>
      ) : (
        <div className="my-offers">
          {result.offers.map(({ offer, listing }) => (
            <div key={offer.id} className="my-offers__row">
              <Link to={`/listings/${listing.id}`} className="my-offers__listing">
                <div className="my-offers__listing-photo">
                  {listing.photoUrl && <img src={listing.photoUrl} alt={listing.name} />}
                </div>
                <div>
                  <span className="my-offers__for">For</span>
                  <strong>{listing.name}</strong>
                  <span className="my-offers__owner">by {listing.ownerName}</span>
                </div>
              </Link>

              <OfferCard
                offer={offer}
                actions={
                  offer.status === 'Pending' && (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => handleWithdraw(offer.id)}
                      disabled={withdrawingId === offer.id}
                    >
                      {withdrawingId === offer.id ? 'Withdrawing…' : 'Withdraw offer'}
                    </button>
                  )
                }
              />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
