import { StoryEditor } from '@/components/admin/story-editor'
import { getAllBeneficiaries, getAllCampaigns, getAllStories } from '@/lib/data'

export const metadata = { title: 'Admin stories' }

export default async function Page() {
  const [initial, allCampaigns, allBeneficiaries] = await Promise.all([
    getAllStories(),
    getAllCampaigns(),
    getAllBeneficiaries(),
  ])
  return (
    <StoryEditor
      initial={initial}
      campaigns={allCampaigns.map((item) => ({ id: item.id, title: item.title }))}
      learners={allBeneficiaries.map((item) => ({ id: item.id, name: item.displayName }))}
    />
  )
}
