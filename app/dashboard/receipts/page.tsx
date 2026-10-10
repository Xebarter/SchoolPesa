import { ReceiptLedger } from '@/components/dashboard/receipt-ledger'
import { donorDonations } from '@/lib/donor'
import { getBeneficiaries, getCampaigns } from '@/lib/data'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'Receipts' }

export default async function Page() {
  const account = await currentAccount()
  const receipts = account ? donorDonations(account.email).filter((item) => item.status === 'Successful') : []
  const campaigns = getCampaigns().map((item) => ({ id: item.id, title: item.title }))
  const learners = getBeneficiaries().map((item) => ({ id: item.id, displayName: item.displayName }))
  return (
    <div className="mx-auto max-w-6xl">
      <ReceiptLedger receipts={receipts} campaigns={campaigns} learners={learners} />
    </div>
  )
}
