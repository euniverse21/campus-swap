import { useEffect, useState } from 'react'
import { getListings } from '../api/listings'
import { ITEM_CATEGORIES } from '../api/types'
import type { ItemCategory, ListingSummary } from '../api/types'
import { ItemCard } from '../components/ItemCard'
import './ListingsPage.css'

interface LoadResult {
  key: string
  listings: ListingSummary[]
  error?: string
}

export function ListingsPage() {
  const [category, setCategory] = useState<ItemCategory | undefined>(undefined)
  const [result, setResult] = useState<LoadResult | null>(null)

  // The result belongs to one filter; if the filter changed, we are loading
  const key = category ?? 'All'
  const isLoading = result?.key !== key

  useEffect(() => {
    let cancelled = false

    getListings({ category })
      .then((page) => {
        if (!cancelled) setResult({ key, listings: page.items })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Something went wrong.'
          setResult({ key, listings: [], error: message })
        }
      })

    // If the filter changes before this request finishes, ignore its answer
    return () => {
      cancelled = true
    }
  }, [category, key])

  return (
    <main className="listings-page">
      <header className="listings-page__header">
        <h1>Campus Swap</h1>
        <p>Swap what you don&apos;t need for what you do — no money involved.</p>
      </header>

      <nav className="category-filter" aria-label="Filter by category">
        <button
          type="button"
          className={category === undefined ? 'is-active' : ''}
          onClick={() => setCategory(undefined)}
        >
          All
        </button>
        {ITEM_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={category === c ? 'is-active' : ''}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </nav>

      {isLoading && <p className="listings-page__message">Loading…</p>}

      {!isLoading && result?.error && (
        <p className="listings-page__message listings-page__message--error">
          Could not load items: {result.error}
        </p>
      )}

      {!isLoading && !result?.error && result?.listings.length === 0 && (
        <p className="listings-page__message">No items in this category yet.</p>
      )}

      {!isLoading && result && result.listings.length > 0 && (
        <div className="listings-grid">
          {result.listings.map((listing) => (
            <ItemCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  )
}
