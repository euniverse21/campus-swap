import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { createListing } from '../api/listings'
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from '../api/types'
import type { ItemCategory, ItemCondition } from '../api/types'
import { GuidelinesConsent } from '../components/GuidelinesConsent'
import { PhotoPicker } from '../components/PhotoPicker'
import { describeError } from '../i18n/describeError'
import { useLanguage } from '../i18n/useLanguage'

const MAX_PHOTOS = 5

export function CreateListingPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ItemCategory | ''>('')
  const [condition, setCondition] = useState<ItemCondition | ''>('')
  const [wantedDescription, setWantedDescription] = useState('')
  const [meetingLocation, setMeetingLocation] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (photos.length === 0) {
      setError(t('create.noPhoto'))
      return
    }

    const form = new FormData()
    form.append('name', name.trim())
    form.append('description', description.trim())
    form.append('category', category)
    form.append('condition', condition)
    form.append('wantedDescription', wantedDescription.trim())
    if (meetingLocation.trim()) form.append('meetingLocation', meetingLocation.trim())
    photos.forEach((photo) => form.append('photos', photo))

    setError(null)
    setIsSubmitting(true)
    try {
      const created = await createListing(form)
      navigate(`/listings/${created.id}`)
    } catch (err) {
      setError(describeError(err, t))
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page page--narrow">
      <div className="form-card">
        <h1>{t('create.title')}</h1>
        <p className="form-card__intro">{t('create.intro')}</p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="form">
          <fieldset className="form-field">
            <span>
              {t('create.photos')} <small>{t('create.photosHint', { max: MAX_PHOTOS })}</small>
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
            <span>{t('create.name')}</span>
            <input
              required
              maxLength={100}
              placeholder={t('create.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="form-row">
            <label className="form-field">
              <span>{t('create.category')}</span>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
              >
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
              <select
                required
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
              >
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

          <label className="form-field">
            <span>{t('create.description')}</span>
            <textarea
              rows={3}
              maxLength={2000}
              placeholder={t('create.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>{t('create.wanted')}</span>
            <textarea
              required
              rows={2}
              maxLength={500}
              placeholder={t('create.wantedPlaceholder')}
              value={wantedDescription}
              onChange={(e) => setWantedDescription(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>
              {t('create.meet')} <small>{t('common.optional')}</small>
            </span>
            <input
              maxLength={200}
              placeholder={t('create.meetPlaceholder')}
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
            />
          </label>

          <GuidelinesConsent />

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={isSubmitting || isPreparingPhotos}
          >
            {isSubmitting ? t('create.publishing') : t('create.publish')}
          </button>
        </form>
      </div>
    </main>
  )
}
