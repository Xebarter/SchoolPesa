import { PageHeader } from '@/components/page-header'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { VolunteerForm } from '@/components/simple-forms'

export const metadata = { title: 'Volunteer' }

export default function Page() {
  return (
    <SiteShell>
      <div className="grid lg:grid-cols-2">
        <Band>
          <Flow width="lg" className="py-16 lg:py-28">
            <PageHeader eyebrow="Give time" title="Volunteer" text="Share a skill with learners, events or the team behind the campaigns." />
          </Flow>
        </Band>
        <Band tone="mist">
          <Flow width="lg" className="py-16 lg:py-28">
            <VolunteerForm />
          </Flow>
        </Band>
      </div>
    </SiteShell>
  )
}
