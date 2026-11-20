// Shapes of the data the API sends back (mirror the C# DTOs)

// The four kinds of exchange. Category and condition apply to physical items ('Item') only.
export type ExchangeType = 'Item' | 'Skill' | 'Service' | 'Experience'

export const EXCHANGE_TYPES: ExchangeType[] = ['Item', 'Skill', 'Service', 'Experience']

export type ItemCategory =
  | 'Books'
  | 'Clothes'
  | 'Electronics'
  | 'Furniture'
  | 'Stationery'
  | 'Jewellery'
  | 'Household'
  | 'Other'

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Books',
  'Clothes',
  'Electronics',
  'Furniture',
  'Stationery',
  'Jewellery',
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
  type: ExchangeType
  category: ItemCategory | null
  condition: ItemCondition | null
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
    type: ExchangeType
    category: ItemCategory | null
    condition: ItemCondition | null
    status: string
    photoUrls: string[]
  }
  pendingOfferCount: number
  isMine: boolean
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

export type OfferStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn' | 'Completed'

export interface OfferedItem {
  id: number
  name: string
  description: string
  type: ExchangeType
  category: ItemCategory | null
  condition: ItemCondition | null
  photoUrls: string[]
}

export interface Offer {
  id: number
  listingId: number
  status: OfferStatus
  type: 'Item' | 'Service'
  message: string | null
  createdAt: string
  offeredBy: Student
  offeredItem: OfferedItem | null
  ownerConfirmedAt: string | null
  offererConfirmedAt: string | null
  isMine: boolean
}

export interface ListingBrief {
  id: number
  name: string
  photoUrl: string | null
  status: ListingStatus
  ownerName: string
}

export interface SentOffer {
  offer: Offer
  listing: ListingBrief
}

export interface ChatMessage {
  id: number
  senderId: number
  senderName: string
  body: string
  sentAt: string
  isMine: boolean
}

export interface MyListing {
  id: number
  name: string
  type: ExchangeType
  status: ListingStatus
  photoUrl: string | null
  createdAt: string
  pendingOfferCount: number
  swapPartnerName: string | null
}
