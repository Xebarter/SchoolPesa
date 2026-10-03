import type { CheckoutDraft } from '@/lib/types'

export type CheckoutResult = {
  reference: string
  status: 'ready'
  provider: string
}

export interface PaymentProvider {
  name: string
  prepareCheckout(draft: CheckoutDraft): Promise<CheckoutResult>
}

export const pendingPaymentProvider: PaymentProvider = {
  name: 'Payment provider',
  async prepareCheckout() {
    return {
      reference: `SP-${Date.now().toString(36).toUpperCase()}`,
      status: 'ready',
      provider: 'Payment provider',
    }
  },
}
