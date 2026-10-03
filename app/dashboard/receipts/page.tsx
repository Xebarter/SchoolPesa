import { PageIntro } from '@/components/admin/ui'
import { DonationsTable } from '@/components/dashboard/donations-table'
import { donations } from '@/lib/data'
import { formatUGX } from '@/lib/format'

export const metadata = { title: 'Receipts' }

export default function Page() {
  const ready = donations.filter((item) => item.status === 'Successful')
  const total = ready.reduce((sum, item) => sum + item.amount, 0)
  return (
    <div>
      <PageIntro title="Receipts" description="Successful gifts are ready for a receipt file. Downloads open once a payment provider is connected." />
      <div className="mt-6 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm shadow-forest/5 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{ready.length} receipts ready</p>
          <p className="mt-1 text-xs text-sage">Covering {formatUGX(total)} in successful gifts.</p>
        </div>
      </div>
      <div className="mt-6">
        <DonationsTable donations={ready} donorView />
      </div>
    </div>
  )
}
