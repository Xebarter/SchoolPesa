import { ChildLinks } from '@/components/dashboard/child-links'
import { donorChildren } from '@/lib/donor'
import { getBeneficiaries } from '@/lib/data'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'Sponsored children' }

export default async function Page() {
  const account = await currentAccount()
  const learners = getBeneficiaries()
  const saved = account ? donorChildren(account.email) : []
  const owned = account ? learners.filter((item) => item.ownerEmail === account.email.trim().toLowerCase()) : []
  return (
    <div className="mx-auto max-w-6xl">
      <ChildLinks saved={saved} learners={learners} owned={owned} />
    </div>
  )
}
