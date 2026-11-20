import { useState } from 'react'
import type { FormEvent } from 'react'
import { createOffer } from '../api/offers'
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from '../api/types'
import type { ExchangeType, ItemCategory, ItemCondition, Offer } from '../api/types'
import { ExchangeTypePicker } from './ExchangeTypePicker'
import { GuidelinesConsent } from './GuidelinesConsent'
import { PhotoPicker } from './PhotoPicker'
import { describeError } from '../i18n/describeError'
import { useLanguage } from '../i18n/useLanguage'

const MAX_PHOTOS = 3

interface OfferFormProps {
  listingId: number
  wantedDescription: string
  onSubmitted: (offer: Offer) => void
  onCancel: () => void
}

export function OfferForm({ listingId, wantedDescription, onSubmitted, onCancel }: OfferFormProps) {
  const { t, tRich } = useLanguage()
  const [type, setType] = useState<ExchangeType>('Item')
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [category, setCategory] = useState<ItemCategory | ''>('')
  const [condition, setCondition] = useState<ItemCondition | ''>('')
  const [message, setMessage] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Category, condition and at least one photo are needed for physical items only
  const isItem = type === 'Item'

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isItem && photos.length === 0) {
      setError(t('offerForm.noPhoto'))
      return
    }

    const form = new FormData()
    form.append('type', type)
    form.append('itemName', itemName.trim())
    form.append('itemDescription', itemDescription.trim())
    if (isItem) {
      form.append('category', category)
      form.append('condition', condition)
    }
    if (message.trim()) form.append('message', message.trim())
    photos.forEach((photo) => form.append('photos', photo))

    setError(null)
    setIsSubmitting(true)
    try {
      const offer = await createOffer(listingId, form)
      onSubmitted(offer)
    } catch (err) {
      setError(describeError(err, t, 'offerForm.error'))
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form offer-form">
      <h2>{t('offers.make')}</h2>
      <p className="offer-form__hint">
        {tRich('offerForm.ownerWants', { wanted: <strong>{wantedDescription}</strong> })}
      </p>

      {error && <p className="form-error">{error}</p>}

      <ExchangeTypePicker label={t('offerForm.typeLabel')} value={type} onChange={setType} />

      <fieldset className="form-field">
        <span>
          {isItem ? t('offerForm.photos') : t('create.photos')}{' '}
          <small>
            {isItem
              ? t('offerForm.photosHint', { max: MAX_PHOTOS })
              : t('create.photosOptionalHint', { max: MAX_PHOTOS })}
          </small>
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
        <span>{isItem ? t('offerForm.item') : t(`create.name.${type}`)}</span>
        <input
          required
          maxLength={100}
          placeholder={isItem ? t('offerForm.itemPlaceholder') : t(`create.namePlaceholder.${type}`)}
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
      </label>

      {isItem && (
        <div className="form-row">
          <label className="form-field">
            <span>{t('create.category')}</span>
            <select required value={category} onChange={(e) => setCategory(e.target.value as ItemCategory)}>
              <option value="" disabled>
                {t('common.choose')}
              </option>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`category.${c}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>{t('create.condition')}</span>
            <select required value={condition} onChange={(e) => setCondition(e.target.value as ItemCondition)}>
              <option value="" disabled>
                {t('common.choose')}
              </option>
              {ITEM_CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(`condition.${c.value}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <label className="form-field">
        <span>
          {t('offerForm.details')} <small>{t('common.optional')}</small>
        </span>
        <textarea
          rows={2}
          maxLength={2000}
          placeholder={isItem ? t('offerForm.detailsPlaceholder') : t(`create.descriptionPlaceholder.${type}`)}
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
        />
      </label>

      <label className="form-field">
        <span>
          {t('offerForm.message')} <small>{t('common.optional')}</small>
        </span>
        <textarea
          rows={2}
          maxLength={1000}
          placeholder={t('offerForm.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <GuidelinesConsent />

      <div className="offer-form__buttons">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting || isPreparingPhotos}>
          {isSubmitting ? t('common.sending') : t('offerForm.send')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
