import { useState } from 'react'
import type { FormEvent } from 'react'
import { createOffer } from '../api/offers'
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from '../api/types'
import type { ItemCategory, ItemCondition, Offer } from '../api/types'
import { GuidelinesConsent } from './GuidelinesConsent'
import { PhotoPicker } from './PhotoPicker'

const MAX_PHOTOS = 3

interface OfferFormProps {
  listingId: number
  wantedDescription: string
  onSubmitted: (offer: Offer) => void
  onCancel: () => void
}

export function OfferForm({ listingId, wantedDescription, onSubmitted, onCancel }: OfferFormProps) {
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [category, setCategory] = useState<ItemCategory | ''>('')
  const [condition, setCondition] = useState<ItemCondition | ''>('')
  const [message, setMessage] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (photos.length === 0) {
      setError('Please add at least one photo of your item.')
      return
    }

    const form = new FormData()
    form.append('itemName', itemName.trim())
    form.append('itemDescription', itemDescription.trim())
    form.append('category', category)
    form.append('condition', condition)
    if (message.trim()) form.append('message', message.trim())
    photos.forEach((photo) => form.append('photos', photo))

    setError(null)
    setIsSubmitting(true)
    try {
      const offer = await createOffer(listingId, form)
      onSubmitted(offer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your offer.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form offer-form">
      <h2>Make an offer</h2>
      <p className="offer-form__hint">
        The owner wants: <strong>{wantedDescription}</strong>
      </p>

      {error && <p className="form-error">{error}</p>}

      <fieldset className="form-field">
        <span>
          Photos of your item <small>(1–{MAX_PHOTOS})</small>
        </span>
        <PhotoPicker
          photos={photos}
          onChange={setPhotos}
          maxPhotos={MAX_PHOTOS}
          onError={setError}
          onBusyChange={setIsPreparingPhotos}
        />
      </fieldset>

      <label className="form-field">
        <span>Your item</span>
        <input
          required
          maxLength={100}
          placeholder="e.g. Blue winter jacket, size M"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Category</span>
          <select required value={category} onChange={(e) => setCategory(e.target.value as ItemCategory)}>
            <option value="" disabled>
              Choose…
            </option>
            {ITEM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Condition</span>
          <select required value={condition} onChange={(e) => setCondition(e.target.value as ItemCondition)}>
            <option value="" disabled>
              Choose…
            </option>
            {ITEM_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="form-field">
        <span>
          Item details <small>(optional)</small>
        </span>
        <textarea
          rows={2}
          maxLength={2000}
          placeholder="Size, brand, any marks…"
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
        />
      </label>

      <label className="form-field">
        <span>
          Message to the owner <small>(optional)</small>
        </span>
        <textarea
          rows={2}
          maxLength={1000}
          placeholder="e.g. I can meet at the City Campus on Thursday"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <GuidelinesConsent />

      <div className="offer-form__buttons">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting || isPreparingPhotos}>
          {isSubmitting ? 'Sending…' : 'Send offer'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
