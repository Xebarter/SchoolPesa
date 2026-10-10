import Link from 'next/link'
import { ArrowUpRight, GraduationCap, Megaphone, NotebookPen, Wallet } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { CampaignBars, DonationsArea, LevelDonut } from '@/components/charts'
import { getAuditLogs, getCampaignBars, getDonationSeries, getDonations, getImpact, getLevelSplit } from '@/lib/data'
import { impactUpdatesInReview } from '@/lib/donor'
import { formatDate, formatUGX } from '@/lib/format'

export default function Page() {
  const impactStats = getImpact()
  const donationSeries = getDonationSeries()
  const campaignBars = getCampaignBars()
  const levelSplit = getLevelSplit()
  const donations = getDonations().slice(0, 5)
  const auditLogs = getAuditLogs().slice(0, 6)
  const waiting = impactUpdatesInReview()
  const stats = [
    { href: '/admin/donations', icon: Wallet, label: 'Total raised', value: formatUGX(impactStats.fundsRaised), hint: `${formatUGX(impactStats.thisMonth)} this month` },
    { href: '/admin/campaigns', icon: Megaphone, label: 'Active campaigns', value: String(impactStats.activeCampaigns), hint: `${impactStats.campaignsCompleted.toLocaleString()} completed` },
    { href: '/admin/beneficiaries', icon: GraduationCap, label: 'Children supported', value: impactStats.childrenSupported.toLocaleString(), hint: `${impactStats.schoolsReached.toLocaleString()} schools reached` },
    { href: '/admin/updates', icon: NotebookPen, label: 'In review', value: String(waiting), hint: waiting === 0 ? 'The queue is clear' : 'Impact updates waiting' },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <header className="border-b border-line pb-6 sm:pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-ink sm:mt-3 sm:text-5xl">Overview</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-sage sm:mt-3">Fundraising on record: gifts, campaigns, and learners.</p>
      </header>

      {waiting > 0 ? (
        <Link href="/admin/updates" className="mt-6 flex items-center justify-between gap-4 border border-line bg-white px-4 py-4 transition-colors hover:bg-cream sm:px-5">
          <span>
            <span className="block text-sm font-semibold text-ink">{waiting} impact update{waiting === 1 ? '' : 's'} waiting for review</span>
            <span className="mt-1 block text-xs text-sage">Open the queue and publish, return, or decline.</span>
          </span>
          <ArrowUpRight className="size-4 shrink-0 text-brand" />
        </Link>
      ) : null}

      <section className="mt-6 grid overflow-hidden border border-line bg-white sm:mt-8 sm:grid-cols-2 xl:grid-cols-4" aria-label="Fundraising summary">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.label} href={item.href} className="group border-b border-line p-4 transition-colors last:border-b-0 hover:bg-cream sm:p-5 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
              <span className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">{item.label}</span>
                <Icon className="size-4 text-brand" />
              </span>
              <span className="mt-3 block text-2xl font-semibold tracking-[-.04em] text-ink sm:mt-4 sm:text-3xl">{item.value}</span>
              <span className="mt-1 block text-xs leading-5 text-sage group-hover:text-forest">{item.hint}</span>
            </Link>
          )
        })}
      </section>

      <div className="mt-6 grid gap-4 lg:mt-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.7fr)]">
        <section className="border border-line bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink">Donations over time</h2>
          <p className="mt-1 text-xs text-sage">Monthly totals, in millions of shillings.</p>
          <div className="mt-4">
            <DonationsArea data={donationSeries} />
          </div>
        </section>
        <section className="border border-line bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink">Education support</h2>
          <p className="mt-1 text-xs text-sage">Share of learners by level.</p>
          <div className="mt-4">
            <LevelDonut data={levelSplit} />
          </div>
        </section>
      </div>

      <section className="mt-4 border border-line bg-white p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Raised by campaign</h2>
            <p className="mt-1 text-xs text-sage">Millions of shillings, excluding drafts.</p>
          </div>
          <Link href="/admin/campaigns" className="shrink-0 text-xs font-semibold text-forest">All campaigns</Link>
        </div>
        <div className="mt-4">
          {campaignBars.length ? <CampaignBars data={campaignBars} /> : <p className="text-sm text-sage">No published campaigns yet.</p>}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="border border-line bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">Recent gifts</h2>
            <Link href="/admin/donations" className="text-xs font-semibold text-forest">Open ledger</Link>
          </div>
          {donations.length ? (
            <ul className="divide-y divide-line">
              {donations.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{item.anonymous ? 'Anonymous' : item.donorName}</p>
                    <p className="mt-0.5 text-xs text-sage">{formatUGX(item.amount)} · {formatDate(item.date)}</p>
                  </div>
                  <StatusPill value={item.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-sm text-sage sm:px-5">No gifts on record.</p>
          )}
        </section>
        <section className="border border-line bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
            <Link href="/admin/audit-logs" className="text-xs font-semibold text-forest">Audit log</Link>
          </div>
          {auditLogs.length ? (
            <ol className="divide-y divide-line">
              {auditLogs.map((item) => (
                <li key={item.id} className="px-4 py-3.5 sm:px-5">
                  <p className="text-sm font-medium leading-5 text-ink">{item.details}</p>
                  <p className="mt-1 text-xs text-sage">{item.user} · {formatDate(item.date)} · {item.time}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-4 py-8 text-sm text-sage sm:px-5">No activity recorded yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
