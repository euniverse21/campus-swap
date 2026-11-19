import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getMyListings } from '../api/listings'
import type { MyListing } from '../api/types'
import './MyListingsPage.css'

interface LoadResult {
  listings: MyListing[]
  error?: string
}

// One line that tells the owner what to do next with this listing
function nextStep(listing: MyListing): string {
  switch (listing.status) {
    case 'Open':
      return listing.pendingOfferCount === 0
        ? 'No offers yet'
        : `${listing.pendingOfferCount} offer${listing.pendingOfferCount === 1 ? '' : 's'} waiting for you`
    case 'Reserved':
      return `Swapping with ${listing.swapPartnerName ?? 'another student'} — open the chat to arrange it`
    case 'Completed':
      return `Swapped with ${listing.swapPartnerName ?? 'another student'}`
    default:
      return 'Cancelled'
  }
}

function ListingRow({ listing }: { listing: MyListing }) {
  const needsAttention =
    (listing.status === 'Open' && listing.pendingOfferCount > 0) || listing.status === 'Reserved'

  return (
    <Link to={`/listings/${listing.id}`} className="my-listing">
      <div className="my-listing__photo">
        {listing.photoUrl ? <img src={listing.photoUrl} alt={listing.name} /> : null}
      </div>
      <div className="my-listing__body">
        <div className="my-listing__top">
          <strong>{listing.name}</strong>
          <span className={`status-badge status-badge--${listing.status.toLowerCase()}`}>{listing.status}</span>
        </div>
        <span className={`my-listing__next ${needsAttention ? 'my-listing__next--attention' : ''}`}>
          {nextStep(listing)}
        </span>
      </div>
    </Link>
  )
}

export function MyListingsPage() {
  const [result, setResult] = useState<LoadResult | null>(null)

  useEffect(() => {
    let cancelled = false

    getMyListings()
      .then((listings) => {
        if (!cancelled) setResult({ listings })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({ listings: [], error: err instanceof Error ? err.message : 'Could not load your listings.' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!result) return <p className="page-message">Loading…</p>

  const active = result.listings.filter((l) => l.status === 'Open' || l.status === 'Reserved')
  const past = result.listings.filter((l) => l.status === 'Completed' || l.status === 'Cancelled')

  return (
    <main className="page page--medium">
      <div className="my-listings__header">
        <h1 className="page-title">My listings</h1>
        <Link to="/listings/new" className="btn btn--primary">
          List an item
        </Link>
      </div>

      {result.error && <p className="form-error">{result.error}</p>}

      {!result.error && result.listings.length === 0 && (
        <p className="page-message">
          You haven&apos;t listed anything yet. <Link to="/listings/new">List your first item →</Link>
        </p>
      )}

      {active.length > 0 && (
        <section className="my-listings__section">
          <h2>Active</h2>
          {active.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="my-listings__section">
          <h2>Past</h2>
          {past.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </main>
  )
}
