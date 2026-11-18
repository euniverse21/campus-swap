import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { createListing } from '../api/listings'
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from '../api/types'
import type { ItemCategory, ItemCondition } from '../api/types'
import { resizeImage } from '../utils/resizeImage'

const MAX_PHOTOS = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function CreateListingPage() {
  const navigate = useNavigate()

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

  // Temporary browser URLs so the selected photos can be previewed before upload
  const previews = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos])
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url))
  }, [previews])

  async function handlePhotosSelected(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = '' // lets the same file be picked again after removing it
    setError(null)

    const room = MAX_PHOTOS - photos.length
    if (selected.length > room) setError(`You can add up to ${MAX_PHOTOS} photos.`)

    setIsPreparingPhotos(true)
    const accepted: File[] = []
    for (const file of selected.slice(0, room)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG or WebP images are allowed.')
        continue
      }
      accepted.push(await resizeImage(file))
    }
    setIsPreparingPhotos(false)

    setPhotos((current) => [...current, ...accepted].slice(0, MAX_PHOTOS))
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (photos.length === 0) {
      setError('Please add at least one photo.')
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
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page page--narrow">
      <div className="form-card">
        <h1>List an item</h1>
        <p className="form-card__intro">
          Describe your item and what you&apos;d like in return. Other students will send you offers.
        </p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="form">
          <fieldset className="form-field">
            <span>
              Photos <small>(1–{MAX_PHOTOS}, the first one is the cover)</small>
            </span>
            <div className="photo-picker">
              {previews.map((url, index) => (
                <div key={url} className="photo-picker__item">
                  <img src={url} alt={`Photo ${index + 1}`} />
                  <button
                    type="button"
                    className="photo-picker__remove"
                    onClick={() => removePhoto(index)}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <label className="photo-picker__add">
                  {isPreparingPhotos ? 'Preparing…' : '+ Add photos'}
                  <input
                    type="file"
                    accept={ACCEPTED_TYPES.join(',')}
                    multiple
                    onChange={handlePhotosSelected}
                    disabled={isPreparingPhotos}
                  />
                </label>
              )}
            </div>
          </fieldset>

          <label className="form-field">
            <span>Item name</span>
            <input
              required
              maxLength={100}
              placeholder="e.g. Database Systems textbook"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="form-row">
            <label className="form-field">
              <span>Category</span>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
              >
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
              <select
                required
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
              >
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
            <span>Description</span>
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Edition, size, any marks or damage…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>What would you like in return?</span>
            <textarea
              required
              rows={2}
              maxLength={500}
              placeholder="e.g. A winter jacket (size M), or open to offers"
              value={wantedDescription}
              onChange={(e) => setWantedDescription(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>
              Where to meet <small>(optional)</small>
            </span>
            <input
              maxLength={200}
              placeholder="e.g. Flinders City Campus, level 1"
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
            />
          </label>

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={isSubmitting || isPreparingPhotos}
          >
            {isSubmitting ? 'Publishing…' : 'Publish listing'}
          </button>
        </form>
      </div>
    </main>
  )
}
