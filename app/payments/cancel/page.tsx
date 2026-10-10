import { PaymentResult } from '@/components/payment-result'

export const metadata = { title: 'Payment cancelled' }

export default async function Page({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference = '' } = await searchParams
  return <PaymentResult reference={reference} outcome="cancel" />
}
