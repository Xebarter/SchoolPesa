'use server'

import { startDonation as begin } from '@/lib/checkout'
import type { CheckoutDraft } from '@/lib/types'

export async function startDonation(draft: CheckoutDraft) {
  try {
    return await begin(draft)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'The payment could not be started.'
    if (/paytota/i.test(message)) throw new Error('The payment could not be started. Try again in a moment.')
    throw cause instanceof Error ? cause : new Error(message)
  }
}
