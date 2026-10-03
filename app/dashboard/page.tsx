import Link from 'next/link'
import { SampleNote } from '@/components/states'
import { donations, impactStats, notifications } from '@/lib/data'
import { formatDate, formatUGX } from '@/lib/format'

export default function Page() {
  const mine = donations.filter((item) => item.status === 'Successful')
  const total = mine.reduce((sum, item) => sum + item.amount, 0)
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">Your impact</p>
      <h1 className="mt-2 text-4xl font-semibold">Welcome back, Sarah</h1>
      <SampleNote />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [formatUGX(total || 1_200_000), 'Total donated'],
          ['12', 'Children supported'],
          [String(mine.length), 'Campaigns supported'],
          ['3', 'Active sponsorships'],
        ].map(([number, label]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-2xl font-semibold text-forest">{number}</p>
            <p className="mt-1 text-sm text-sage">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-semibold">Recent donations</h2>
          <ul className="mt-4 divide-y divide-line text-sm">
            {donations.slice(0, 4).map((item) => (
              <li key={item.id} className="flex justify-between py-3">
                <span>{formatDate(item.date)} · {item.status}</span>
                <span className="font-semibold">{formatUGX(item.amount)}</span>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/donations" className="mt-3 inline-block text-sm font-semibold text-forest">All donations</Link>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-semibold">Recent impact updates</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {notifications.map((item) => <li key={item.id}><p className="font-semibold">{item.title}</p><p className="text-sage">{item.body}</p></li>)}
          </ul>
          <p className="mt-4 text-xs text-sage">{impactStats.childrenSupported.toLocaleString()} children supported across sample campaigns.</p>
        </section>
      </div>
    </div>
  )
}
