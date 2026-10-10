import Link from 'next/link'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { paymentStatus } from '@/lib/checkout'
import { formatUGX } from '@/lib/format'

export default async function Page({ searchParams }: { searchParams: Promise<{ reference?: string; outcome?: string }> }) {
  const { reference = '', outcome = 'success' } = await searchParams
  const payment = reference ? paymentStatus(reference) : null
  const confirmed = payment?.status === 'Successful' || outcome === 'success'
  const cancelled = outcome === 'cancel'
  const title = cancelled ? 'The payment was cancelled.' : confirmed && payment?.status === 'Successful' ? 'Your gift is confirmed.' : outcome === 'failure' ? 'The payment was not completed.' : 'We are confirming your gift.'
  return (
    <SiteShell>
      <Band>
        <Flow width="md" className="py-24">
          <h1 className="text-4xl font-semibold text-ink">{title}</h1>
          {payment ? <p className="mt-4 text-lg text-sage">{formatUGX(payment.amount)} · {payment.frequency} · {payment.status}. Reference {payment.reference}.</p> : <p className="mt-4 text-lg text-sage">If you approved the prompt, the gift will appear in your donations shortly.</p>}
          <Link href="/donate" className="mt-8 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">Back to giving</Link>
        </Flow>
      </Band>
    </SiteShell>
  )
}
