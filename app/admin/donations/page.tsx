import { DonationLedger } from '@/components/admin/donation-ledger'
import { getAllBeneficiaries, getAllCampaigns, getDonations } from '@/lib/data'

export const metadata = { title: 'Admin donations' }

export default async function Page() {
  const [donations, allCampaigns, allBeneficiaries] = await Promise.all([
    getDonations(),
    getAllCampaigns(),
    getAllBeneficiaries(),
  ])
  const campaigns = allCampaigns.map((item) => ({ id: item.id, label: item.title }))
  const learners = allBeneficiaries.map((item) => ({ id: item.id, label: item.displayName }))
  return <DonationLedger donations={donations} campaigns={campaigns} learners={learners} />
}
