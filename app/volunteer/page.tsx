import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'
import { VolunteerForm } from '@/components/simple-forms'

export const metadata = { title: 'Volunteer' }

export default function Page() {
  return (
    <SiteShell>
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 lg:grid-cols-[1fr_.9fr] lg:px-8">
        <PageHeader eyebrow="Give time" title="Volunteer" text="Share a skill with learners, events or the team behind the campaigns." />
        <VolunteerForm />
      </div>
    </SiteShell>
  )
}
