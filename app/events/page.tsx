import Image from 'next/image'
import { PageHeader } from '@/components/page-header'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { EventRegister } from '@/components/simple-forms'
import { getEvents } from '@/lib/data'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Events' }

export default function Page() {
  const events = getEvents()
  return (
    <SiteShell>
      <Band>
        <Flow className="py-16 lg:py-24">
          <PageHeader layout="split" eyebrow="Come along" title="Events" text="Reading clubs, briefings and classroom visits." />
          <div className="mt-14 grid items-start gap-x-12 gap-y-14 lg:grid-cols-[1.35fr_.8fr]">
            {events[0] ? (
              <article>
                <div className="relative aspect-[1.05] overflow-hidden bg-mist"><Image src={events[0].image} alt="" fill className="object-cover" sizes="50vw" /></div>
                <div className="pt-5">
                  <h2 className="max-w-[14ch] text-4xl font-semibold leading-[1.05] tracking-[-.03em]">{events[0].name}</h2>
                  <p className="mt-3 text-sm text-sage">{formatDate(events[0].date)} · {events[0].time}</p>
                  <p className="text-sm text-sage">{events[0].location}</p>
                  <p className="mt-3 max-w-md text-base leading-7 text-sage">{events[0].description}</p>
                  <div className="mt-5"><EventRegister name={events[0].name} /></div>
                </div>
              </article>
            ) : null}
            <div className="grid gap-10">
              {events.slice(1).map((event) => (
                <article key={event.id}>
                  <div className="relative aspect-[1.4] overflow-hidden bg-mist"><Image src={event.image} alt="" fill className="object-cover" sizes="30vw" /></div>
                  <div className="pt-4">
                    <h2 className="text-2xl font-semibold tracking-[-.03em]">{event.name}</h2>
                    <p className="mt-2 text-sm text-sage">{formatDate(event.date)} · {event.time}</p>
                    <p className="text-sm text-sage">{event.location}</p>
                    <p className="mt-3 text-sm leading-6 text-sage">{event.description}</p>
                    <div className="mt-4"><EventRegister name={event.name} /></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Flow>
      </Band>
    </SiteShell>
  )
}
