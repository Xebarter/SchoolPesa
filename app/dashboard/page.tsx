import Link from 'next/link'
import { ArrowRight, GraduationCap, Heart, Megaphone, Wallet } from 'lucide-react'
import { Panel, StatusPill } from '@/components/admin/ui'
import { SampleNote } from '@/components/states'
import { beneficiaries, donations, getBeneficiary, getCampaignById, notifications } from '@/lib/data'
import { formatDate, formatUGX } from '@/lib/format'

const supportedIds = ['camp-1', 'camp-2', 'camp-3']

export default function Page() {
  const mine = donations.filter((item) => item.status === 'Successful')
  const total = mine.reduce((sum, item) => sum + item.amount, 0)
  const recent = donations.slice(0, 4)
  const stats = [
    { icon: Wallet, label: 'Total donated', value: formatUGX(total || 1_200_000), hint: `${mine.length} successful gifts` },
    { icon: GraduationCap, label: 'Children supported', value: String(beneficiaries.length), hint: 'Active sponsorships' },
    { icon: Megaphone, label: 'Campaigns', value: String(supportedIds.length), hint: 'Causes you have backed' },
    { icon: Heart, label: 'Impact notes', value: String(notifications.filter((item) => !item.read).length), hint: 'Unread updates' },
  ]

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-forest-deep text-white">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-brand/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between lg:p-8">
          <div className="min-w-0 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Your impact</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, Sarah</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">Your gifts are keeping children in class. This is a snapshot of the campaigns, learners and receipts tied to your account.</p>
            <SampleNote className="mt-3 text-white/45" />
          </div>
          <Link href="/donate" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep">
            Give again <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-2xl border border-line bg-white p-5 shadow-sm shadow-forest/5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">{item.label}</p>
                <span className="grid size-8 place-items-center rounded-xl bg-mist text-forest">
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-forest">{item.value}</p>
              <p className="mt-1 text-xs text-sage">{item.hint}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Panel title="Recent donations" description="Latest gifts on your account" action={<Link href="/dashboard/donations" className="text-xs font-semibold text-forest hover:underline">View all</Link>} className="lg:col-span-3">
          <ul className="divide-y divide-line">
            {recent.map((item) => {
              const campaign = item.campaignId ? getCampaignById(item.campaignId) : undefined
              const child = item.beneficiaryId ? getBeneficiary(item.beneficiaryId) : undefined
              const title = campaign?.title ?? (child ? `Support for ${child.displayName}` : 'General support')
              return (
                <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{title}</p>
                    <p className="mt-0.5 text-xs text-sage">{formatDate(item.date)} · {item.method}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-ink">{formatUGX(item.amount)}</p>
                    <div className="mt-1"><StatusPill value={item.status} /></div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel title="Impact updates" description="News from causes you follow" action={<Link href="/dashboard/updates" className="text-xs font-semibold text-forest hover:underline">All updates</Link>} className="lg:col-span-2">
          <ul className="divide-y divide-line">
            {notifications.map((item) => (
              <li key={item.id} className="px-5 py-4">
                <div className="flex items-center gap-2">
                  {!item.read ? <span className="size-1.5 rounded-full bg-brand" aria-hidden /> : null}
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                </div>
                <p className="mt-1 text-sm leading-6 text-sage">{item.body}</p>
                <p className="mt-2 text-xs text-sage">{formatDate(item.date)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
