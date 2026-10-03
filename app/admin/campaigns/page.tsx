import { CampaignManager } from '@/components/admin/campaign-manager'
import { campaigns } from '@/lib/data'

export const metadata = { title: 'Admin campaigns' }

export default function Page() {
  return <CampaignManager initial={campaigns} />
}
