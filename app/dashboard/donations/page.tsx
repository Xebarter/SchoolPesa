import { DonationsTable } from '@/components/dashboard/donations-table'
import { donations } from '@/lib/data'

export const metadata = { title: 'My donations' }

export default function Page() {
  return (
    <div>
      <h1 className="text-3xl font-semibold">My donations</h1>
      <p className="mt-2 mb-6 text-sm text-sage">Search and filter gifts. Receipt files are prepared for a payment provider.</p>
      <DonationsTable donations={donations} donorView />
    </div>
  )
}
