import { StoryEditor } from '@/components/admin/story-editor'
import { stories } from '@/lib/data'

export const metadata = { title: 'Admin stories' }

export default function Page() {
  return <StoryEditor initial={stories} />
}
