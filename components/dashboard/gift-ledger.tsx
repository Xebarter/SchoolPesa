'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { GiftForm } from '@/components/dashboard/gift-form'
import { Input, Select } from '@/components/ui/input'
import { deleteDonationRecord, updateDonationMessage } from '@/lib/donor-actions'
import { formatDate, formatUGX } from '@/lib/format'
import type { Beneficiary, Campaign, Donation } from '@/lib/types'

const statuses = ['Pending', 'Processing', 'Successful', 'Failed', 'Cancelled', 'Refunded']

export function GiftLedger({
  donations,
  campaigns,
  learners,
}: {
  donations: Donation[]
  campaigns: Pick<Campaign, 'id' | 'title'>[]
  learners: Pick<Beneficiary, 'id' | 'displayName'>[]
}) {
  const router = useRouter()
  const campaignTitle = useMemo(() => new Map(campaigns.map((item) => [item.id, item.title])), [campaigns])
  const learnerName = useMemo(() => new Map(learners.map((item) => [item.id, item.displayName])), [learners])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [composing, setComposing] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const methods = [...new Set(donations.map((item) => item.method).filter(Boolean))]
  const confirmed = donations.filter((item) => item.status === 'Successful')
  const given = confirmed.reduce((sum, item) => sum + item.amount, 0)
  const figures = [
    [String(donations.length), 'On record'],
    [String(confirmed.length), 'Confirmed'],
    [formatUGX(given), 'Given'],
  ]
  const rows = donations.filter((item) => {
    const title = labelFor(item, campaignTitle, learnerName)
    const haystack = `${title} ${item.transactionId} ${item.method} ${item.message ?? ''} ${item.status}`.toLowerCase()
    if (query && !haystack.includes(query.trim().toLowerCase())) return false
    if (status && item.status !== status) return false
    if (method && item.method !== method) return false
    return true
  })

  async function saveNote(item: Donation) {
    setError('')
    setNotice('')
    setPendingId(item.id)
    try {
      await updateDonationMessage(item.id, drafts[item.id] ?? item.message ?? '')
      setNotice('Note saved.')
      setOpenId(null)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The note could not be saved.')
    } finally {
      setPendingId(null)
    }
  }

  async function remove(id: string) {
    setError('')
    setNotice('')
    setPendingId(id)
    try {
      await deleteDonationRecord(id)
      setConfirming(null)
      setNotice('Gift removed from your account.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The gift could not be removed.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Your gifts</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.045em] text-ink sm:text-5xl">Donations</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-sage">Every gift on this account, with its status, note and receipt.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-forest hover:border-forest" aria-expanded={composing} onClick={() => setComposing((value) => !value)}>
            {composing ? 'Close' : 'Record a gift'}
          </button>
          <Link href="/donate" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep">
            Give <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <section className="mt-8 grid overflow-hidden border border-line bg-white sm:grid-cols-3" aria-label="Donation summary">
        {figures.map(([value, label]) => (
          <div key={label} className="border-b border-line p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-.04em] text-ink">{value}</p>
          </div>
        ))}
      </section>

      {composing ? (
        <div className="mt-8">
          <GiftForm campaigns={campaigns} learners={learners} onDone={() => { setComposing(false); setNotice('Pending gift saved.') }} />
        </div>
      ) : null}

      <section className="mt-8 border border-line bg-white">
        <div className="grid gap-3 border-b border-line p-4 md:grid-cols-[1fr_11rem_11rem]">
          <Input aria-label="Search gifts" placeholder="Search by cause, reference or note" value={query} onChange={(event) => setQuery(event.target.value)} className="bg-cream" />
          <Select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)} className="bg-cream">
            <option value="">All statuses</option>
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select aria-label="Payment method" value={method} onChange={(event) => setMethod(event.target.value)} className="bg-cream">
            <option value="">All methods</option>
            {methods.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </div>
        {notice ? <p className="border-b border-line px-5 py-3 text-sm font-medium text-forest" role="status">{notice}</p> : null}
        {error ? <p className="border-b border-line px-5 py-3 text-sm text-destructive" role="alert">{error}</p> : null}
        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-lg font-semibold tracking-tight text-ink">{donations.length === 0 ? 'No gifts on this account yet.' : 'Nothing matches these filters.'}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-sage">{donations.length === 0 ? 'Give from your phone, or record a pending gift to keep the intention here.' : 'Clear a filter to see the rest of your gifts.'}</p>
            {donations.length === 0 ? <Link href="/donate" className="mt-5 inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep">Give now</Link> : (
              <button type="button" className="mt-5 text-sm font-semibold text-forest" onClick={() => { setQuery(''); setStatus(''); setMethod('') }}>Clear filters</button>
            )}
          </div>
        ) : (
          <ul>
            {rows.map((item) => {
              const title = labelFor(item, campaignTitle, learnerName)
              const open = openId === item.id
              const busy = pendingId === item.id
              return (
                <li key={item.id} className="border-b border-line last:border-b-0">
                  <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{title}</p>
                      <p className="mt-1 text-xs text-sage">{formatDate(item.date)} · {item.method} · {item.frequency === 'monthly' ? 'Monthly' : 'One-time'}</p>
                      <p className="mt-1 font-mono text-[11px] tracking-wide text-sage">{item.transactionId}</p>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-semibold text-ink">{formatUGX(item.amount)}</p>
                        <div className="mt-1"><StatusPill value={item.status} /></div>
                      </div>
                      <button type="button" className="text-xs font-semibold text-forest" aria-expanded={open} onClick={() => { setOpenId(open ? null : item.id); setConfirming(null) }}>
                        {open ? 'Close' : 'Details'}
                      </button>
                    </div>
                  </div>
                  {open ? (
                    <div className="border-t border-line bg-cream px-5 py-4">
                      {item.message && drafts[item.id] === undefined ? <p className="mb-3 text-sm leading-6 text-sage">{item.message}</p> : null}
                      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-sage">Note
                        <Input className="mt-2 bg-white" aria-label={`Note for ${item.transactionId}`} value={drafts[item.id] ?? item.message ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))} />
                      </label>
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <button type="button" className="text-sm font-semibold text-forest disabled:opacity-50" disabled={busy} onClick={() => void saveNote(item)}>{busy && confirming !== item.id ? 'Saving…' : 'Save note'}</button>
                        {item.status === 'Successful' ? (
                          <a className="text-sm font-semibold text-ink" href={`/api/payments/receipt?reference=${encodeURIComponent(item.transactionId)}`}>Download receipt</a>
                        ) : (
                          <p className="text-xs text-sage">A receipt is ready once this gift is confirmed.</p>
                        )}
                        {confirming === item.id ? (
                          <span className="flex items-center gap-3 text-sm">
                            <span className="text-sage">Remove this gift?</span>
                            <button type="button" className="font-semibold text-ink disabled:opacity-50" disabled={busy} onClick={() => void remove(item.id)}>Remove</button>
                            <button type="button" className="font-semibold text-forest" onClick={() => setConfirming(null)}>Keep</button>
                          </span>
                        ) : (
                          <button type="button" className="text-sm font-semibold text-ink" onClick={() => setConfirming(item.id)}>Remove</button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function labelFor(item: Donation, campaigns: Map<string, string>, learners: Map<string, string>) {
  if (item.campaignId && campaigns.get(item.campaignId)) return campaigns.get(item.campaignId) as string
  if (item.beneficiaryId && learners.get(item.beneficiaryId)) return `Support for ${learners.get(item.beneficiaryId)}`
  return 'Education support'
}
