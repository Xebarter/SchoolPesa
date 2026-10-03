import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'

export const metadata = { title: 'Terms' }

export default function Page() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <PageHeader eyebrow="Terms" title="Terms of use" text="How gifts, campaigns and accounts work on School Pesa." />
        <div className="mt-8 space-y-4 text-sm leading-7 text-sage">
          <p>A donation review prepares a gift for a payment provider. School Pesa does not complete a charge until that provider is connected.</p>
          <p>Campaign totals on this demo are sample figures. Live totals will come from recorded donations.</p>
          <p>Accounts are for donors and administrators. Role permissions decide who can publish, approve finance or only view.</p>
        </div>
      </div>
    </SiteShell>
  )
}
