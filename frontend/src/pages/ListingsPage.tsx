import { useEffect, useState } from 'react'
import { getListings } from '../api/listings'
import { EXCHANGE_TYPES, ITEM_CATEGORIES } from '../api/types'
import type { ExchangeType, ItemCategory, ListingSummary } from '../api/types'
import { ItemCard } from '../components/ItemCard'
import { describeError } from '../i18n/describeError'
import { useLanguage } from '../i18n/useLanguage'
import { EXCHANGE_ICONS } from '../utils/exchangeTypes'
import './ListingsPage.css'

interface LoadResult {
  key: string
  listings: ListingSummary[]
  error?: string
}

export function ListingsPage() {
  const { t } = useLanguage()
  const [type, setType] = useState<ExchangeType | undefined>(undefined)
  const [category, setCategory] = useState<ItemCategory | undefined>(undefined)
  const [result, setResult] = useState<LoadResult | null>(null)

  // The result belongs to one filter; if the filter changed, we are loading
  const key = `${type ?? 'All'}:${category ?? 'All'}`
  const isLoading = result?.key !== key

  useEffect(() => {
    let cancelled = false

    getListings({ type, category })
      .then((page) => {
        if (!cancelled) setResult({ key, listings: page.items })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({ key, listings: [], error: describeError(err, t) })
        }
      })

    // If the filter changes before this request finishes, ignore its answer
    return () => {
      cancelled = true
    }
  }, [type, category, key, t])

  // Categories only apply to physical items, so switching the kind of exchange clears them
  function chooseType(next: ExchangeType | undefined) {
    setType(next)
    setCategory(undefined)
  }

  return (
    <main className="listings-page">
      <header className="listings-page__header">
        <h1>{t('listings.title')}</h1>
        <p>{t('listings.subtitle')}</p>
      </header>

      <nav className="category-filter" aria-label={t('listings.typeFilterLabel')}>
        <button
          type="button"
          className={type === undefined ? 'is-active' : ''}
          aria-pressed={type === undefined}
          onClick={() => chooseType(undefined)}
        >
          {t('listings.all')}
        </button>
        {EXCHANGE_TYPES.map((x) => (
          <button
            key={x}
            type="button"
            className={type === x ? 'is-active' : ''}
            aria-pressed={type === x}
            onClick={() => chooseType(x)}
          >
            <span aria-hidden="true">{EXCHANGE_ICONS[x]}</span> {t(`exchangeGroup.${x}`)}
          </button>
        ))}
      </nav>

      {type === 'Item' && (
        <nav className="category-filter category-filter--sub" aria-label={t('listings.filterLabel')}>
          <button
            type="button"
            className={category === undefined ? 'is-active' : ''}
            aria-pressed={category === undefined}
            onClick={() => setCategory(undefined)}
          >
            {t('listings.all')}
          </button>
          {ITEM_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? 'is-active' : ''}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {t(`category.${c}`)}
            </button>
          ))}
        </nav>
      )}

      {isLoading && <p className="listings-page__message">{t('common.loading')}</p>}

      {!isLoading && result?.error && (
        <p className="listings-page__message listings-page__message--error">
          {t('listings.loadError', { error: result.error })}
        </p>
      )}

      {!isLoading && !result?.error && result?.listings.length === 0 && (
        <p className="listings-page__message">{t('listings.empty')}</p>
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
