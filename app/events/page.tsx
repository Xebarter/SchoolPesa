import Image from 'next/image'
import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'
import { EventRegister } from '@/components/simple-forms'
import { events } from '@/lib/data'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Events' }

export default function Page() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <PageHeader eyebrow="Come along" title="Events" text="Reading clubs, briefings and classroom visits." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {events.map((event) => (
            <article key={event.id} className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="relative aspect-[1.4] bg-mist"><Image src={event.image} alt="" fill className="object-cover" /></div>
              <div className="p-5">
                <h2 className="text-xl font-semibold">{event.name}</h2>
                <p className="mt-2 text-sm text-sage">{formatDate(event.date)} · {event.time}</p>
                <p className="text-sm text-sage">{event.location}</p>
                <p className="mt-3 text-sm leading-6">{event.description}</p>
                <div className="mt-4"><EventRegister name={event.name} /></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SiteShell>
  )
}
