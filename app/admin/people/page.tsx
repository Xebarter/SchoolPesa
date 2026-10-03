import { PageIntro, Panel, StatusPill } from '@/components/admin/ui'
import { donations, partners, volunteers } from '@/lib/data'

export const metadata = { title: 'Admin people' }

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export default function Page() {
  const donors = donations.filter((item) => !item.anonymous)
  return (
    <div>
      <PageIntro title="People" description="Donors, volunteers and partner organizations connected to School Pesa." />
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel title="Donors" description={`${donors.length} named gifts`} className="xl:col-span-2">
          <ul className="divide-y divide-line">
            {donors.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-semibold text-forest">{initials(item.donorName)}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.donorName}</p>
                  <p className="truncate text-xs text-sage">{item.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Partners" description={`${partners.length} organizations`}>
          <ul className="divide-y divide-line">
            {partners.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white">{initials(item.name)}</span>
                <p className="text-sm font-semibold text-ink">{item.name}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Volunteers" description="Applications waiting on review" className="xl:col-span-3">
          <ul className="divide-y divide-line">
            {volunteers.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-mist text-xs font-semibold text-forest">{initials(item.name)}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-sage">{item.interest} · {item.availability}</p>
                  </div>
                </div>
                <StatusPill value={item.status} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
