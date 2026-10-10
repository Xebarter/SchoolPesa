import { PageIntro } from '@/components/admin/ui'
import { UpdateBoard } from '@/components/dashboard/update-board'
import { donorCampaigns, donorChildren, donorStories, donorUpdates } from '@/lib/donor'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'Impact updates' }

export default async function Page() {
  const account = await currentAccount()
  const notes = account ? donorUpdates(account.email) : []
  const stories = account ? donorStories(account.email) : []
  const causes = account
    ? [
        ...donorCampaigns(account.email).map((item) => ({ id: item.id, kind: 'campaign' as const, label: item.title })),
        ...donorChildren(account.email).map((item) => ({ id: item.id, kind: 'learner' as const, label: item.displayName })),
      ]
    : []
  return (
    <div>
      <PageIntro title="Impact updates" description="Draft a note, send it for review, and follow it through edits until an admin publishes it." />
      <div className="mt-6">
        <UpdateBoard notes={notes} stories={stories} causes={causes} />
      </div>
    </div>
  )
}
