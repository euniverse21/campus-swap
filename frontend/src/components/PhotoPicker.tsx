import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { resizeImage } from '../utils/resizeImage'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface PhotoPickerProps {
  photos: File[]
  onChange: (photos: File[]) => void
  maxPhotos: number
  onError: (message: string | null) => void
  // Tells the parent while photos are being resized, so it can disable "Submit"
  onBusyChange?: (busy: boolean) => void
}

// Shared by "List an item" and "Make an offer": pick, preview, remove and shrink photos
export function PhotoPicker({ photos, onChange, maxPhotos, onError, onBusyChange }: PhotoPickerProps) {
  const [isPreparing, setIsPreparing] = useState(false)

  // Temporary browser URLs so the selected photos can be previewed before upload
  const previews = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos])
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url))
  }, [previews])

  async function handleSelected(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = '' // lets the same file be picked again after removing it
    onError(null)

    const room = maxPhotos - photos.length
    if (selected.length > room) onError(`You can add up to ${maxPhotos} photos.`)

    setIsPreparing(true)
    onBusyChange?.(true)

    const accepted: File[] = []
    for (const file of selected.slice(0, room)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        onError('Only JPEG, PNG or WebP images are allowed.')
        continue
      }
      accepted.push(await resizeImage(file))
    }

    setIsPreparing(false)
    onBusyChange?.(false)
    onChange([...photos, ...accepted].slice(0, maxPhotos))
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index))
  }

  return (
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

      {photos.length < maxPhotos && (
        <label className="photo-picker__add">
          {isPreparing ? 'Preparing…' : '+ Add photos'}
          <input
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            onChange={handleSelected}
            disabled={isPreparing}
          />
        </label>
      )}
    </div>
  )
}
