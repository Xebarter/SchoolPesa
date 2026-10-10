'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { createAdminDonation, deleteAdminDonation, updateAdminDonation } from '@/lib/admin-actions'
import { formatDate, formatUGX } from '@/lib/format'
import type { Donation, DonationStatus } from '@/lib/types'

const methods = ['Bank transfer', 'Cash', 'Mobile money', 'Cheque']
const statuses: DonationStatus[] = ['Successful', 'Processing', 'Pending', 'Failed', 'Cancelled', 'Refunded']

type Option = { id: string; label: string }

const blank = {
  donorName: '',
  email: '',
  phone: '',
  amount: '',
  method: 'Mobile money',
  date: '',
  campaignId: '',
  beneficiaryId: '',
  message: '',
}

const field = 'mt-2 rounded-none'

function todayKampala() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function DonationLedger({
  donations,
  campaigns,
  learners,
}: {
  donations: Donation[]
  campaigns: Option[]
  learners: Option[]
}) {
  const router = useRouter()
  const campaignTitle = useMemo(() => new Map(campaigns.map((item) => [item.id, item.label])), [campaigns])
  const learnerName = useMemo(() => new Map(learners.map((item) => [item.id, item.label])), [learners])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(blank)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (creating || editing) document.getElementById('gift-form')?.scrollIntoView({ block: 'nearest' })
  }, [creating, editing])

  const month = todayKampala().slice(0, 7)
  const successful = donations.filter((item) => item.status === 'Successful')
  const confirmed = successful.reduce((sum, item) => sum + item.amount, 0)
  const thisMonth = successful.filter((item) => item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0)
  const figures = [
    [String(donations.length), 'On record'],
    [formatUGX(confirmed), 'Confirmed'],
    [formatUGX(thisMonth), 'This month'],
    [String(donations.filter((item) => item.status === 'Failed' || item.status === 'Cancelled').length), 'Unsuccessful'],
  ]

  const rows = donations.filter((item) => {
    const cause = campaignTitle.get(item.campaignId ?? '') ?? learnerName.get(item.beneficiaryId ?? '') ?? ''
    const haystack = `${item.donorName} ${item.email} ${item.transactionId} ${item.method} ${cause}`.toLowerCase()
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false
    if (status && item.status !== status) return false
    if (method && item.method !== method) return false
    return true
  })

  function closeForm() {
    setCreating(false)
    setEditing(null)
    setForm(blank)
  }

  function beginEdit(item: Donation) {
    setCreating(false)
    setEditing(item.id)
    setError('')
    setNotice('')
    setForm({
      donorName: item.donorName,
      email: item.email,
      phone: item.phone,
      amount: String(item.amount),
      method: methods.includes(item.method) ? item.method : 'Bank transfer',
      date: item.date,
      campaignId: item.campaignId ?? '',
      beneficiaryId: item.beneficiaryId ?? '',
      message: item.message ?? '',
    })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    const payload = { ...form, amount: Number(form.amount) }
    try {
      if (editing) await updateAdminDonation(editing, payload)
      else await createAdminDonation(payload)
      setNotice(editing ? 'Gift updated.' : 'Gift recorded and marked confirmed.')
      closeForm()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The gift could not be saved.')
    } finally {
      setPending(false)
    }
  }

  async function remove(id: string) {
    setPending(true)
    setError('')
    setNotice('')
    try {
      await deleteAdminDonation(id)
      setConfirming(null)
      if (editing === id) closeForm()
      setNotice('Gift removed.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The gift could not be removed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Finance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-ink sm:mt-3 sm:text-5xl">Donations</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-sage sm:mt-3">Gifts on record. A gift you record here is confirmed and counted toward its campaign or learner.</p>
        </div>
        <button type="button" className="inline-flex h-11 items-center justify-center gap-2 bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep" aria-expanded={creating} onClick={() => { setCreating((value) => !value); setEditing(null); setForm({ ...blank, date: todayKampala() }); setError(''); setNotice('') }}>
          <Plus className="size-4" />
          {creating ? 'Close form' : 'Record gift'}
        </button>
      </header>

      <section className="mt-6 overflow-hidden border border-line bg-forest-deep text-white sm:mt-8 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]" aria-label="Gift summary">
        <div className="p-5 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Confirmed</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-.045em] tabular-nums sm:text-5xl">{formatUGX(confirmed)}</p>
          <p className="mt-3 text-sm text-white/60">{formatUGX(thisMonth)} received this month · {successful.length} confirmed {successful.length === 1 ? 'gift' : 'gifts'}</p>
        </div>
        <div className="grid grid-cols-3 border-t border-white/10 lg:border-t-0 lg:border-l">
          {figures.filter(([, label]) => label !== 'Confirmed').map(([value, label]) => (
            <div key={label} className="border-r border-white/10 p-4 last:border-r-0 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
              <p className="mt-2 text-lg font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {(notice || error) ? (
        <p className={`mt-4 border px-4 py-3 text-sm ${error ? 'border-[#e7cfc7] bg-[#f8ece8] text-[#8d4b38]' : 'border-line bg-white text-ink'}`} role={error ? 'alert' : 'status'}>{error || notice}</p>
      ) : null}

      {(creating || editing) ? (
        <form id="gift-form" className="mt-4 border border-line bg-white p-4 sm:p-5" onSubmit={save}>
          <h2 className="text-sm font-semibold text-ink">{editing ? 'Edit gift' : 'Record a gift'}</h2>
          <p className="mt-1 text-xs leading-5 text-sage">{editing ? 'Changing the amount or the cause updates the confirmed total.' : 'Use this for a gift received outside the payment prompt. The donor is told it is confirmed.'}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Label>Donor name<Input className={field} value={form.donorName} onChange={(event) => setForm({ ...form, donorName: event.target.value })} required /></Label>
            <Label>Email<Input className={field} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></Label>
            <Label>Phone<Input className={field} inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Label>
            <Label>Amount (UGX)<Input className={field} inputMode="numeric" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></Label>
            <Label>Received as
              <Select className={field} value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
                {(methods.includes(form.method) ? methods : [form.method, ...methods]).map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>Date received<Input className={field} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></Label>
            <Label>Campaign
              <Select className={field} value={form.campaignId} onChange={(event) => setForm({ ...form, campaignId: event.target.value, beneficiaryId: event.target.value ? '' : form.beneficiaryId })}>
                <option value="">None</option>
                {campaigns.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </Select>
            </Label>
            <Label>Learner
              <Select className={field} value={form.beneficiaryId} onChange={(event) => setForm({ ...form, beneficiaryId: event.target.value, campaignId: event.target.value ? '' : form.campaignId })}>
                <option value="">None</option>
                {learners.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </Select>
            </Label>
            <Label className="sm:col-span-2">Note<Textarea className={`${field} min-h-24`} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></Label>
          </div>
          <p className="mt-3 text-xs leading-5 text-sage">Choose a campaign or a learner. Leaving both empty records general support.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="submit" className="inline-flex h-11 items-center justify-center bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-60" disabled={pending}>{pending ? 'Saving…' : editing ? 'Update gift' : 'Save gift'}</button>
            <button type="button" className="inline-flex h-11 items-center justify-center border border-line bg-white px-5 text-sm font-semibold text-forest" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      ) : null}

      <section className="mt-6 border border-line bg-white">
        <div className="border-b border-line p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Ledger</h2>
              <p className="mt-1 text-xs text-sage">{rows.length} of {donations.length} gifts</p>
            </div>
            <label className="relative block sm:w-72">
              <span className="sr-only">Search gifts</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sage" />
              <input className="h-11 w-full border border-line bg-cream pl-10 pr-3 text-sm text-ink outline-none placeholder:text-sage/70 focus-visible:ring-2 focus-visible:ring-brand" value={query} placeholder="Donor, email, reference, or cause" onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto">
            <Chip active={!status} onClick={() => setStatus('')}>All</Chip>
            {statuses.map((item) => <Chip key={item} active={status === item} onClick={() => setStatus(item)}>{item}</Chip>)}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            <Chip active={!method} onClick={() => setMethod('')}>Any method</Chip>
            {[...new Set(donations.map((item) => item.method).filter(Boolean))].map((item) => <Chip key={item} active={method === item} onClick={() => setMethod(item)}>{item}</Chip>)}
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-sage">{donations.length === 0 ? 'No gifts on record yet.' : 'No gifts match that search.'}</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((item) => {
              const cause = item.beneficiaryId ? learnerName.get(item.beneficiaryId) : item.campaignId ? campaignTitle.get(item.campaignId) : 'General support'
              const name = item.anonymous ? 'Anonymous' : item.donorName
              const initial = name.trim().charAt(0).toUpperCase() || '•'
              const open = openId === item.id
              return (
                <li key={item.id}>
                  <button type="button" className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-cream sm:gap-4 sm:px-5" aria-expanded={open} onClick={() => setOpenId(open ? null : item.id)}>
                    <span className="grid size-10 shrink-0 place-items-center bg-cream text-sm font-semibold text-forest">{initial}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{name}</span>
                      <span className="mt-0.5 block truncate text-xs text-sage">{cause || 'General support'} · {formatDate(item.date)}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-sm font-semibold tabular-nums tracking-tight text-ink">{formatUGX(item.amount)}</span>
                      <StatusPill value={item.status} />
                    </span>
                  </button>
                  {open ? (
                    <div className="border-t border-line bg-cream px-4 py-4 sm:px-5">
                      <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Method</dt><dd className="mt-1 text-ink">{item.method}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Reference</dt><dd className="mt-1 font-mono text-xs text-ink">{item.transactionId}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Email</dt><dd className="mt-1 break-all text-ink">{item.email || '—'}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Phone</dt><dd className="mt-1 text-ink">{item.phone || '—'}</dd></div>
                        {item.message ? <div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Note</dt><dd className="mt-1 leading-6 text-ink">{item.message}</dd></div> : null}
                      </dl>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button type="button" className="inline-flex h-11 items-center justify-center border border-line bg-white px-4 text-sm font-semibold text-forest" onClick={() => beginEdit(item)}>Edit</button>
                        {confirming === item.id ? (
                          <>
                            <button type="button" className="inline-flex h-11 items-center justify-center bg-[#8d4b38] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} onClick={() => void remove(item.id)}>Confirm remove</button>
                            <button type="button" className="inline-flex h-11 items-center justify-center px-4 text-sm font-semibold text-sage" onClick={() => setConfirming(null)}>Keep</button>
                          </>
                        ) : (
                          <button type="button" className="inline-flex h-11 items-center justify-center px-4 text-sm font-semibold text-[#8d4b38]" onClick={() => setConfirming(item.id)}>Remove</button>
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

function Chip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" className={`h-9 shrink-0 px-3 text-xs font-semibold ${active ? 'bg-brand text-white' : 'border border-line bg-white text-forest'}`} onClick={onClick}>{children}</button>
  )
}
