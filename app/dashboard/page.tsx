import Link from 'next/link'
import { ArrowRight, ArrowUpRight, GraduationCap, Heart, Megaphone, Wallet } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { CampaignProgress } from '@/components/campaign-progress'
import { NotificationActions, ReminderForm } from '@/components/dashboard/notification-board'
import { donorCampaigns, donorChildren, donorDonations, donorNotifications } from '@/lib/donor'
import { getBeneficiary, getCampaignById } from '@/lib/data'
import { formatDate, formatUGX, percentOf } from '@/lib/format'
import { currentAccount } from '@/lib/supabase/session'

function greeting(name: string) {
  const hour = Number(new Intl.DateTimeFormat('en-UG', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Africa/Kampala' }).format(new Date()))
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const first = name.trim().split(/\s+/)[0]
  return `${hello}, ${first || 'there'}`
}

function kampalaMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit' }).format(new Date())
  return parts.slice(0, 7)
}

export default async function Page() {
  const account = await currentAccount()
  const email = account?.email ?? ''
  const name = account?.name ?? 'Donor'
  const donations = email ? donorDonations(email) : []
  const campaigns = email ? donorCampaigns(email) : []
  const children = email ? donorChildren(email) : []
  const notifications = email ? donorNotifications(email) : []
  const confirmed = donations.filter((item) => item.status === 'Successful')
  const total = confirmed.reduce((sum, item) => sum + item.amount, 0)
  const monthKey = kampalaMonth()
  const thisMonth = confirmed.filter((item) => item.date.startsWith(monthKey)).reduce((sum, item) => sum + item.amount, 0)
  const unread = notifications.filter((item) => !item.read).length
  const recent = donations.slice(0, 5)
  const causes = campaigns.slice(0, 3)
  const stats = [
    { href: '/dashboard/donations', icon: Wallet, label: 'Given', value: formatUGX(total), hint: thisMonth > 0 ? `${formatUGX(thisMonth)} this month` : `${confirmed.length} confirmed gifts` },
    { href: '/dashboard/sponsored', icon: GraduationCap, label: 'Learners', value: String(children.length), hint: children.length === 1 ? 'One learner on your account' : 'Learners you are supporting' },
    { href: '/dashboard/campaigns', icon: Megaphone, label: 'Campaigns', value: String(campaigns.length), hint: 'Causes you follow or have backed' },
    { href: '/dashboard/notifications', icon: Heart, label: 'Unread', value: String(unread), hint: unread === 0 ? 'You are caught up' : 'Reminders waiting for you' },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Your giving</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.045em] text-ink sm:text-5xl">{greeting(name)}</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-sage">A clear view of what you have given, who it reaches, and what still needs you.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/dashboard/receipts" className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-forest hover:border-forest">Receipts</Link>
          <Link href="/donate" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep">
            Give <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="mt-8 grid overflow-hidden border border-line bg-white sm:grid-cols-2 xl:grid-cols-4" aria-label="Giving summary">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.label} href={item.href} className="group border-b border-line p-5 transition-colors last:border-b-0 hover:bg-cream sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
              <span className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">{item.label}</span>
                <Icon className="size-4 text-brand" />
              </span>
              <span className="mt-4 block text-3xl font-semibold tracking-[-.04em] text-ink">{item.value}</span>
              <span className="mt-1 block text-xs leading-5 text-sage group-hover:text-forest">{item.hint}</span>
            </Link>
          )
        })}
      </section>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <section className="border border-line bg-white">
          <div className="flex items-end justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">Recent gifts</h2>
              <p className="mt-0.5 text-xs text-sage">Newest activity on your account</p>
            </div>
            <Link href="/dashboard/donations" className="text-xs font-semibold text-forest hover:text-brand">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-lg font-semibold tracking-tight text-ink">Your first gift will live here.</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-sage">Choose an amount and approve the prompt on your phone. The record, status and receipt stay on this account.</p>
              <Link href="/donate" className="mt-5 inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep">Give now</Link>
            </div>
          ) : (
            <ul>
              {recent.map((item) => {
                const campaign = item.campaignId ? getCampaignById(item.campaignId) : undefined
                const child = item.beneficiaryId ? getBeneficiary(item.beneficiaryId) : undefined
                const title = campaign?.title ?? (child ? `Support for ${child.displayName}` : 'Education support')
                const href = item.status === 'Successful' ? '/dashboard/receipts' : '/dashboard/donations'
                return (
                  <li key={item.id} className="border-b border-line last:border-b-0">
                    <Link href={href} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-cream">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{title}</span>
                        <span className="mt-1 block text-xs text-sage">{formatDate(item.date)} · {item.method}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold text-ink">{formatUGX(item.amount)}</span>
                        <span className="mt-1 inline-flex"><StatusPill value={item.status} /></span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="grid gap-8">
          <section className="border border-line bg-white p-5">
            <h2 className="text-lg font-semibold tracking-tight text-ink">A note for later</h2>
            <p className="mt-1 text-sm leading-6 text-sage">Keep a private reminder. It stays on this account.</p>
            <div className="mt-4"><ReminderForm /></div>
            {notifications.length > 0 ? (
              <ul className="mt-5 divide-y divide-line border-t border-line">
                {notifications.slice(0, 3).map((item) => (
                  <li key={item.id} className="py-4">
                    <div className="flex items-start gap-2">
                      {!item.read ? <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden /> : <span className="mt-1.5 size-1.5 shrink-0" aria-hidden />}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{item.title}</p>
                        {item.body ? <p className="mt-1 text-sm leading-6 text-sage">{item.body}</p> : null}
                        <p className="mt-1 text-xs text-sage">{formatDate(item.date)}</p>
                        <NotificationActions id={item.id} read={item.read} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href="/dashboard/notifications" className="mt-2 inline-flex text-xs font-semibold text-forest hover:text-brand">All reminders</Link>
          </section>

          <section className="bg-forest px-5 py-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Next</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Keep a child in school.</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">A fee, a book or a uniform is a practical way to continue what you have already started.</p>
            <Link href="/donate" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink hover:bg-cream">
              Give again <ArrowUpRight className="size-4" />
            </Link>
          </section>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Where your support goes</h2>
          <Link href="/dashboard/campaigns" className="text-xs font-semibold text-forest hover:text-brand">{campaigns.length ? 'Manage' : 'Add a cause'}</Link>
        </div>
        {causes.length === 0 ? (
          <div className="mt-4 border border-dashed border-line bg-white px-5 py-8">
            <p className="text-sm font-semibold text-ink">No cause on your account yet.</p>
            <p className="mt-1 max-w-md text-sm leading-6 text-sage">Follow a campaign or give toward one, and its progress will sit here.</p>
            <Link href="/campaigns" className="mt-4 inline-flex text-sm font-semibold text-forest hover:text-brand">Browse campaigns</Link>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {causes.map((item) => (
              <li key={item.id} className="border border-line bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{item.category}</p>
                <h3 className="mt-2 text-base font-semibold tracking-tight text-ink">
                  <Link href={`/campaigns/${item.slug}`} className="hover:text-forest">{item.title}</Link>
                </h3>
                <p className="mt-1 text-xs text-sage">{item.location}</p>
                <div className="mt-4">
                  <CampaignProgress raised={item.raised} target={item.target} />
                  <p className="mt-2 text-xs text-sage">{percentOf(item.raised, item.target)}% of {formatUGX(item.target)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
