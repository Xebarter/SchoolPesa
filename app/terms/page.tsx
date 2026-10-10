import { PageHeader } from '@/components/page-header'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'

export const metadata = { title: 'Terms' }

export default function Page() {
  return (
    <SiteShell>
      <Band>
        <Flow width="md" className="py-16 lg:py-24">
          <PageHeader eyebrow="Terms" title="Terms of use" text="How gifts, campaigns and accounts work on School Pesa." />
          <div className="mt-12 space-y-6 text-lg leading-8 text-sage">
            <p>A donation sends a mobile money prompt to the number you enter. The gift is confirmed when you approve that prompt.</p>
            <p>Campaign totals on this demo are sample figures. Live totals will come from recorded donations.</p>
            <p>Accounts are for donors and administrators. Role permissions decide who can publish, approve finance or only view.</p>
          </div>
        </Flow>
      </Band>
    </SiteShell>
  )
}
