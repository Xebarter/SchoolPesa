import { ImpactReview } from '@/components/admin/impact-review'
import { getAllBeneficiaries, getAllCampaigns } from '@/lib/data'
import { listImpactUpdates } from '@/lib/donor'

export const metadata = { title: 'Impact updates' }

export default async function Page() {
  const [updates, allCampaigns, allBeneficiaries] = await Promise.all([
    listImpactUpdates(),
    getAllCampaigns(),
    getAllBeneficiaries(),
  ])
  const campaigns = allCampaigns.map((item) => ({ id: item.id, label: item.title }))
  const learners = allBeneficiaries.map((item) => ({ id: item.id, label: item.displayName }))
  return <ImpactReview updates={updates} campaigns={campaigns} learners={learners} />
}
