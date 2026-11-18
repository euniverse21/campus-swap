import { apiFetch } from './client'
import type { ItemCategory, ListingSummary, PagedResult } from './types'

export interface ListingQuery {
  category?: ItemCategory
  search?: string
  page?: number
  pageSize?: number
}

export function getListings(query: ListingQuery = {}): Promise<PagedResult<ListingSummary>> {
  const params = new URLSearchParams()
  if (query.category) params.set('category', query.category)
  if (query.search) params.set('search', query.search)
  params.set('page', String(query.page ?? 1))
  params.set('pageSize', String(query.pageSize ?? 20))

  return apiFetch<PagedResult<ListingSummary>>(`/api/listings?${params}`)
}
