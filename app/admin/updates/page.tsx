import { ImpactReview } from '@/components/admin/impact-review'
import { listBeneficiaries, listCampaigns } from '@/lib/db'
import { listImpactUpdates } from '@/lib/donor'

export const metadata = { title: 'Impact updates' }

export default function Page() {
  const updates = listImpactUpdates()
  const campaigns = listCampaigns().map((item) => ({ id: item.id, label: item.title }))
  const learners = listBeneficiaries().map((item) => ({ id: item.id, label: item.displayName }))
  return <ImpactReview updates={updates} campaigns={campaigns} learners={learners} />
}
