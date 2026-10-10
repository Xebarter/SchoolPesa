import { Suspense } from 'react'
import { CampaignBrowser } from '@/components/campaign-browser'
import { PageHeader } from '@/components/page-header'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { LoadingState } from '@/components/states'
import { campaignCategories, campaignLevels, campaignLocations, queryCampaigns, type CampaignQuery } from '@/lib/data'

export const metadata = { title: 'Campaigns' }

export default async function Page({ searchParams }: { searchParams: Promise<CampaignQuery> }) {
  const query = await searchParams
  const campaigns = queryCampaigns(query)
  return (
    <SiteShell>
      <Band>
        <Flow className="py-16 lg:py-24">
          <PageHeader layout="split" eyebrow="Find a way to help" title="Campaigns making change" text="Every campaign is a clear, practical step toward keeping a child in school." />
          <Suspense fallback={<div className="mt-10"><LoadingState label="Loading campaigns" /></div>}>
            <CampaignBrowser campaigns={campaigns} query={query} total={campaigns.length} levels={campaignLevels()} categories={campaignCategories()} locations={campaignLocations()} />
          </Suspense>
        </Flow>
      </Band>
    </SiteShell>
  )
}
