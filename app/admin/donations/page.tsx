import { DonationLedger } from '@/components/admin/donation-ledger'
import { getBeneficiaries, getCampaigns, getDonations } from '@/lib/data'

export const metadata = { title: 'Admin donations' }

export default function Page() {
  const donations = getDonations()
  const campaigns = getCampaigns().map((item) => ({ id: item.id, label: item.title }))
  const learners = getBeneficiaries().map((item) => ({ id: item.id, label: item.displayName }))
  return <DonationLedger donations={donations} campaigns={campaigns} learners={learners} />
}
