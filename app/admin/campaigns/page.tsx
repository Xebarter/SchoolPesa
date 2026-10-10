import { CampaignManager } from '@/components/admin/campaign-manager'
import { getCampaigns } from '@/lib/data'

export const metadata = { title: 'Admin campaigns' }

export default function Page() {
  return <CampaignManager initial={getCampaigns()} />
}
