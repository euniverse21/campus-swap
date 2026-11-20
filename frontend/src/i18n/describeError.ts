import { ApiError } from '../api/client'
import type { MessageKey } from './en'
import type { Translate } from './LanguageContext'

// The API answers in English. These are its fixed messages, so they can be shown in the student's language.
const SERVER_MESSAGES: Record<string, MessageKey> = {
  'Please use your university email address.': 'server.universityEmail',
  'The code is invalid or has expired. Please request a new one.': 'server.codeInvalid',
  'The code must be 6 digits.': 'server.codeDigits',
  'Please choose a nickname.': 'server.nickname',
  'Please write a message.': 'server.writeMessage',
  'Invalid photos.': 'server.invalidPhotos',
  'Each photo must be smaller than 5 MB.': 'server.photoSize',
  'Only JPEG, PNG or WebP images are allowed.': 'server.photoType',
  'You cannot make an offer on your own listing.': 'server.ownListing',
  'This listing is no longer accepting offers.': 'server.notAccepting',
  'You already have a pending offer on this listing. Withdraw it first to send a different one.':
    'server.alreadyPending',
  'Only the two students in this swap can read these messages.': 'server.chatReadOnlyParticipants',
  'Only the two students in this swap can send messages.': 'server.chatSendOnlyParticipants',
  'You can message each other only while the swap is active.': 'server.chatOnlyActive',
  'This listing is no longer open. Another offer may have been accepted.': 'server.listingNotOpen',
  'Only pending offers can be accepted.': 'server.onlyPendingAccept',
  'One of the items is no longer available.': 'server.itemUnavailable',
  'Someone changed this swap at the same time. Please refresh and try again.': 'server.changedAtSameTime',
  'Another offer has already been accepted for this listing.': 'server.otherAccepted',
  'Only pending offers can be rejected.': 'server.onlyPendingReject',
  'Only pending offers can be withdrawn. This offer may have just been accepted.': 'server.onlyPendingWithdraw',
  'Only open listings can be cancelled.': 'server.onlyOpenCancel',
  'Only accepted swaps that are not completed yet can be confirmed.': 'server.onlyActiveConfirm',
  'Only accepted swaps that are not completed yet can be cancelled.': 'server.onlyActiveCancel',
  'Only the owner of the listing can accept offers.': 'server.ownerAccept',
  'Only the owner of the listing can reject offers.': 'server.ownerReject',
  'You can only withdraw your own offers.': 'server.ownOffersOnly',
  'Only the owner can cancel this listing.': 'server.ownerCancel',
  'Only the two students in this swap can confirm it.': 'server.participantsConfirm',
  'Only the two students in this swap can cancel it.': 'server.participantsCancel',
  'Please choose a category.': 'server.chooseCategory',
  'Please choose the condition.': 'server.chooseCondition',
}

// Turns any caught error into a message in the student's language
export function describeError(
  err: unknown,
  t: Translate,
  fallback: MessageKey = 'common.somethingWrong',
): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return t('errors.tooManyRequests')

    const known = SERVER_MESSAGES[err.message]
    if (known) return t(known)

    const photoCount = /^Please add between \d+ and (\d+) photos\.$/.exec(err.message)
    if (photoCount) return t('server.photoCount', { max: photoCount[1] })

    const photoMax = /^You can add up to (\d+) photos\.$/.exec(err.message)
    if (photoMax) return t('photos.max', { max: photoMax[1] })

    const failed = /^Request failed \((\d+)\)$/.exec(err.message)
    if (failed) return t('errors.requestFailed', { status: failed[1] })

    // A message we have no translation for: show the API's English text
    return err.message
  }

  // fetch() throws a TypeError when the server cannot be reached at all
  if (err instanceof TypeError) return t('errors.network')

  return t(fallback)
}
