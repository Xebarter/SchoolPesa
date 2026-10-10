import { PaymentResult } from '@/components/payment-result'

export const metadata = { title: 'Gift confirmed' }

export default async function Page({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference = '' } = await searchParams
  return <PaymentResult reference={reference} outcome="success" />
}
