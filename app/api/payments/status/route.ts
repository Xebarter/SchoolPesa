import { paymentStatus } from '@/lib/checkout'

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get('reference') || ''
  const payment = paymentStatus(reference)
  if (!payment) return Response.json({ status: 'unknown' }, { status: 404 })
  return Response.json(payment)
}
