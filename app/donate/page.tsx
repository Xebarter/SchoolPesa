import { Suspense } from 'react'
import { DonationForm } from '@/components/donation-form'
import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'
import { LoadingState } from '@/components/states'
import { beneficiaries, campaigns } from '@/lib/data'

export const metadata = { title: 'Donate' }

export default function Page() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
        <div className="text-center">
          <PageHeader eyebrow="Give with purpose" title="Your gift keeps learning going." text="Choose an amount, who you want to support, and review the gift before payment." />
        </div>
        <Suspense fallback={<LoadingState label="Loading donation form" />}>
          <DonationForm campaigns={campaigns} beneficiaries={beneficiaries} />
        </Suspense>
      </div>
    </SiteShell>
  )
}
