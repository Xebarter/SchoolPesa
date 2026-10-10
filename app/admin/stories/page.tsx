import { StoryEditor } from '@/components/admin/story-editor'
import { getBeneficiaries, getCampaigns, getStories } from '@/lib/data'

export const metadata = { title: 'Admin stories' }

export default function Page() {
  return (
    <StoryEditor
      initial={getStories()}
      campaigns={getCampaigns().map((item) => ({ id: item.id, title: item.title }))}
      learners={getBeneficiaries().map((item) => ({ id: item.id, name: item.displayName }))}
    />
  )
}
