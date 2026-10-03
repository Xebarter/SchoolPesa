import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'

export const metadata = { title: 'Privacy policy' }

export default function Page() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <PageHeader eyebrow="Privacy" title="Privacy policy" text="School Pesa publishes only what an administrator marks as public." />
        <div className="mt-8 space-y-4 text-sm leading-7 text-sage">
          <p>Learner profiles use a display name, education level and general location. Photos and stories stay private unless public image and story visibility are turned on.</p>
          <p>Donor details are used to prepare a gift, send a receipt and show impact updates. Anonymous gifts hide the donor name on public lists.</p>
          <p>When Supabase is connected, authentication and records stay in that project. The browser only receives the anon key.</p>
        </div>
      </div>
    </SiteShell>
  )
}
