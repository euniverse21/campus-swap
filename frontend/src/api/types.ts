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

export type ItemCondition = 'New' | 'LikeNew' | 'Good' | 'Fair'

export const ITEM_CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'New', label: 'New' },
  { value: 'LikeNew', label: 'Like new' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
]

export type ListingStatus = 'Open' | 'Reserved' | 'Completed' | 'Cancelled'

export interface Student {
  id: number
  displayName: string
}

export interface SessionResponse {
  token: string
  expiresAt: string
  student: Student
}

export interface ListingSummary {
  id: number
  name: string
  category: ItemCategory
  condition: ItemCondition
  wantedDescription: string
  ownerName: string
  photoUrls: string[]
  createdAt: string
}

export interface ListingDetail {
  id: number
  status: ListingStatus
  wantedDescription: string
  meetingLocation: string | null
  createdAt: string
  owner: Student
  item: {
    id: number
    name: string
    description: string
    category: ItemCategory
    condition: ItemCondition
    status: string
    photoUrls: string[]
  }
  isMine: boolean
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}
