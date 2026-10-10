import Link from 'next/link'
import { ReceiptDownload } from '@/components/receipt-download'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { paymentStatus } from '@/lib/checkout'
import { formatUGX } from '@/lib/format'

export async function PaymentResult({ reference, outcome }: { reference: string; outcome: 'success' | 'failure' | 'cancel' }) {
  const payment = reference ? paymentStatus(reference) : null
  const confirmed = payment?.status === 'Successful'
  const title = outcome === 'cancel'
    ? 'The payment was cancelled.'
    : confirmed
      ? 'Your gift is confirmed.'
      : outcome === 'failure' || payment?.status === 'Failed'
        ? 'The payment was not completed.'
        : 'We are confirming your gift.'
  return (
    <SiteShell>
      <Band>
        <Flow width="md" className="py-24">
          <h1 className="text-4xl font-semibold text-ink">{title}</h1>
          {payment ? <p className="mt-4 text-lg text-sage">{formatUGX(payment.amount)} · {payment.frequency} · {payment.status}. Reference {payment.reference}.</p> : <p className="mt-4 text-lg text-sage">If you approved the prompt, the gift will appear in your donations shortly.</p>}
          {payment && payment.status !== 'Failed' && payment.status !== 'Cancelled' ? <ReceiptDownload reference={payment.reference} /> : null}
          <Link href="/donate" className="mt-4 inline-flex rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white">Back to giving</Link>
        </Flow>
      </Band>
    </SiteShell>
  )
}
