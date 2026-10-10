import Link from 'next/link'
import { PageIntro } from '@/components/admin/ui'
import { ChildLinks } from '@/components/dashboard/child-links'
import { donorChildren } from '@/lib/donor'
import { getBeneficiaries } from '@/lib/data'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'Sponsored children' }

export default async function Page() {
  const account = await currentAccount()
  const beneficiaries = getBeneficiaries()
  const saved = account ? donorChildren(account.email) : []
  return (
    <div>
      <PageIntro title="Sponsored children" description="Add a learner, update your note, or remove them from your account.">
        <Link href="/sponsor" className="bg-mist px-3.5 py-2 text-xs font-semibold text-forest hover:bg-forest hover:text-white">View public profiles</Link>
      </PageIntro>
      <div className="mt-6">
        <ChildLinks saved={saved} choices={beneficiaries.map((item) => ({ id: item.id, displayName: item.displayName }))} />
      </div>
    </div>
  )
}
