import { PageIntro } from '@/components/admin/ui'
import { UpdateBoard } from '@/components/dashboard/update-board'
import { donorStories, donorUpdates } from '@/lib/donor'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'Impact updates' }

export default async function Page() {
  const account = await currentAccount()
  const notes = account ? donorUpdates(account.email) : []
  const stories = account ? donorStories(account.email) : []
  return (
    <div>
      <PageIntro title="Impact updates" description="Write, edit and remove your own notes. Stories from causes you support are listed underneath." />
      <div className="mt-6">
        <UpdateBoard notes={notes} stories={stories} />
      </div>
    </div>
  )
}
