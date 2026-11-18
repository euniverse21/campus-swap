import { apiFetch } from './client'
import type { Offer, SentOffer } from './types'

// Owner gets every offer on the listing; anyone else gets only their own
export function getOffersForListing(listingId: number): Promise<Offer[]> {
  return apiFetch<Offer[]>(`/api/listings/${listingId}/offers`)
}

// form = multipart/form-data: itemName, itemDescription, category, condition, message, photos
export function createOffer(listingId: number, form: FormData): Promise<Offer> {
  return apiFetch<Offer>(`/api/listings/${listingId}/offers`, { method: 'POST', body: form })
}

export function withdrawOffer(offerId: number): Promise<void> {
  return apiFetch<void>(`/api/offers/${offerId}/withdraw`, { method: 'POST' })
}

export function getMyOffers(): Promise<SentOffer[]> {
  return apiFetch<SentOffer[]>('/api/offers/mine')
}

// Listing owner only
export function acceptOffer(offerId: number): Promise<void> {
  return apiFetch<void>(`/api/offers/${offerId}/accept`, { method: 'POST' })
}

export function rejectOffer(offerId: number): Promise<void> {
  return apiFetch<void>(`/api/offers/${offerId}/reject`, { method: 'POST' })
}
