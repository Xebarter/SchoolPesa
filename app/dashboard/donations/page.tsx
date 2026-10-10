import { GiftLedger } from '@/components/dashboard/gift-ledger'
import { donorDonations } from '@/lib/donor'
import { getBeneficiaries, getCampaigns } from '@/lib/data'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'My donations' }

export default async function Page() {
  const account = await currentAccount()
  const donations = account ? donorDonations(account.email) : []
  const campaigns = getCampaigns().map((item) => ({ id: item.id, title: item.title }))
  const learners = getBeneficiaries().map((item) => ({ id: item.id, displayName: item.displayName }))
  return (
    <div className="mx-auto max-w-6xl">
      <GiftLedger donations={donations} campaigns={campaigns} learners={learners} />
    </div>
  )
}
