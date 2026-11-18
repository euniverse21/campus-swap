// Shapes of the data the API sends back (mirror the C# DTOs)

export type ItemCategory =
  | 'Books'
  | 'Clothes'
  | 'Jewellery'
  | 'Electronics'
  | 'Household'
  | 'Other'

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Books',
  'Clothes',
  'Jewellery',
  'Electronics',
  'Household',
  'Other',
]

export interface ListingSummary {
  id: number
  name: string
  category: ItemCategory
  condition: string
  wantedDescription: string
  ownerName: string
  photoUrls: string[]
  createdAt: string
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}
