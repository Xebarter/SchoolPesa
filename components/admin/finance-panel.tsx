'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { CampaignProgress } from '@/components/campaign-progress'
import { Input, Label, Select } from '@/components/ui/input'
import { deleteExpense, saveExpense } from '@/lib/admin-actions'
import { formatDate, formatUGX, percentOf } from '@/lib/format'
import type { Expense } from '@/lib/types'

type ExpenseStatus = 'recorded' | 'approved' | 'paid'
type CampaignOption = { id: string; title: string; raised: number; target: number; status: string }

const statuses: ExpenseStatus[] = ['recorded', 'approved', 'paid']
const categories = ['Books', 'Uniforms', 'Tuition', 'Meals', 'Fees', 'Transport', 'General']

const blank = {
  date: '',
  category: 'Books',
  description: '',
  amount: '',
  supplier: '',
  receipt: '',
  campaignId: '',
  status: 'recorded' as ExpenseStatus,
}

const field = 'mt-2 rounded-none'

function todayKampala() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function FinancePanel({
  expenses,
  campaigns,
  confirmedGifts,
  giftCount,
}: {
  expenses: Expense[]
  campaigns: CampaignOption[]
  confirmedGifts: number
  giftCount: number
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(blank)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (creating || editing) document.getElementById('expense-form')?.scrollIntoView({ block: 'nearest' })
  }, [creating, editing])

  const campaignTitle = new Map(campaigns.map((item) => [item.id, item.title]))
  const paid = expenses.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
  const approved = expenses.filter((item) => item.status === 'approved').reduce((sum, item) => sum + item.amount, 0)
  const recorded = expenses.filter((item) => item.status === 'recorded').reduce((sum, item) => sum + item.amount, 0)
  const raised = campaigns.reduce((sum, item) => sum + item.raised, 0)
  const position = raised - paid
  const categoryOptions = [...new Set([...categories, ...expenses.map((item) => item.category)].filter(Boolean))]

  const filtered = expenses.filter((item) => {
    const cause = campaignTitle.get(item.campaignId ?? '') ?? ''
    const haystack = `${item.description} ${item.supplier} ${item.receipt} ${item.category} ${cause}`.toLowerCase()
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false
    if (status && item.status !== status) return false
    if (category && item.category !== category) return false
    return true
  })

  function closeForm() {
    setCreating(false)
    setEditing(null)
    setForm(blank)
  }

  function fill(item: Expense) {
    setForm({
      date: item.date,
      category: item.category,
      description: item.description,
      amount: String(item.amount),
      supplier: item.supplier,
      receipt: item.receipt,
      campaignId: item.campaignId ?? '',
      status: item.status,
    })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      await saveExpense({
        id: editing ?? undefined,
        date: form.date,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        supplier: form.supplier,
        receipt: form.receipt,
        campaignId: form.campaignId || undefined,
        status: form.status,
      })
      setNotice(editing ? 'Expense updated.' : 'Expense recorded.')
      closeForm()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The expense could not be saved.')
    } finally {
      setPending(false)
    }
  }

  async function remove(id: string) {
    setPending(true)
    setError('')
    setNotice('')
    try {
      await deleteExpense(id)
      setConfirming(null)
      if (editing === id) closeForm()
      setNotice('Expense removed.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The expense could not be removed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Finance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-ink sm:mt-3 sm:text-5xl">Allocations</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-sage sm:mt-3">What campaigns have raised, what has been paid, and what is still waiting for approval.</p>
        </div>
        <button type="button" className="inline-flex h-11 items-center justify-center gap-2 bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep" aria-expanded={creating} onClick={() => { setCreating((value) => !value); setEditing(null); setForm({ ...blank, date: todayKampala() }); setError(''); setNotice('') }}>
          <Plus className="size-4" />
          {creating ? 'Close form' : 'Add expense'}
        </button>
      </header>

      <section className="mt-6 overflow-hidden border border-line bg-forest-deep text-white sm:mt-8 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.9fr)]" aria-label="Finance summary">
        <div className="p-5 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Raised minus paid</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-.045em] tabular-nums sm:text-5xl">{formatUGX(position)}</p>
          <p className="mt-3 text-sm text-white/60">{formatUGX(raised)} raised across campaigns · {formatUGX(paid)} paid out</p>
        </div>
        <div className="grid grid-cols-3 border-t border-white/10 lg:border-t-0 lg:border-l">
          {[
            ['Paid', formatUGX(paid)],
            ['Approved', formatUGX(approved)],
            ['Recorded', formatUGX(recorded)],
          ].map(([label, value]) => (
            <div key={label} className="border-r border-white/10 p-4 last:border-r-0 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
              <p className="mt-2 text-lg font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-4 text-sm text-sage">
        The donation ledger shows {formatUGX(confirmedGifts)} across {giftCount} confirmed {giftCount === 1 ? 'gift' : 'gifts'}.{' '}
        <Link href="/admin/donations" className="font-semibold text-forest">Open donations</Link>
      </p>

      {(notice || error) ? (
        <p className={`mt-4 border px-4 py-3 text-sm ${error ? 'border-[#e7cfc7] bg-[#f8ece8] text-[#8d4b38]' : 'border-line bg-white text-ink'}`} role={error ? 'alert' : 'status'}>{error || notice}</p>
      ) : null}

      {(creating || editing) ? (
        <form id="expense-form" className="mt-4 border border-line bg-white p-4 sm:p-5" onSubmit={save}>
          <h2 className="text-sm font-semibold text-ink">{editing ? 'Edit expense' : 'New expense'}</h2>
          <p className="mt-1 text-xs leading-5 text-sage">Recorded expenses wait for approval. Paid expenses count against the campaign.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Label>Date<Input className={field} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></Label>
            <Label>Category
              <Select className={field} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {(categoryOptions.includes(form.category) ? categoryOptions : [form.category, ...categoryOptions]).map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
            <Label className="sm:col-span-2">Description<Input className={field} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></Label>
            <Label>Amount (UGX)<Input className={field} inputMode="numeric" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></Label>
            <Label>Status
              <Select className={field} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ExpenseStatus })}>
                {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>Campaign
              <Select className={field} value={form.campaignId} onChange={(event) => setForm({ ...form, campaignId: event.target.value })}>
                <option value="">General, no campaign</option>
                {campaigns.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </Select>
            </Label>
            <Label>Supplier<Input className={field} value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} /></Label>
            <Label className="sm:col-span-2">Receipt reference<Input className={field} value={form.receipt} placeholder="Left blank, a reference is assigned" onChange={(event) => setForm({ ...form, receipt: event.target.value })} /></Label>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="submit" className="inline-flex h-11 items-center justify-center bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-60" disabled={pending}>{pending ? 'Saving…' : editing ? 'Update expense' : 'Save expense'}</button>
            <button type="button" className="inline-flex h-11 items-center justify-center border border-line bg-white px-5 text-sm font-semibold text-forest" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      ) : null}

      <section className="mt-6 border border-line bg-white">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold text-ink">By campaign</h2>
          <p className="mt-1 text-xs text-sage">Raised on the campaign, against what has been approved or paid.</p>
        </div>
        <ul className="divide-y divide-line">
          {campaigns.map((campaign) => {
            const spent = expenses.filter((item) => item.campaignId === campaign.id && item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
            const waiting = expenses.filter((item) => item.campaignId === campaign.id && item.status === 'approved').reduce((sum, item) => sum + item.amount, 0)
            return (
              <li key={campaign.id} className="px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{campaign.title}</p>
                    <p className="mt-1 text-xs text-sage">{formatUGX(spent)} paid · {formatUGX(waiting)} approved · target {formatUGX(campaign.target)}</p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-ink">{percentOf(campaign.raised, campaign.target)}%</p>
                </div>
                <div className="mt-3">
                  <CampaignProgress raised={campaign.raised} target={campaign.target} />
                </div>
                <p className="mt-2 text-xs text-sage">{formatUGX(campaign.raised)} raised</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-4 border border-line bg-white">
        <div className="border-b border-line p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Expenses</h2>
              <p className="mt-1 text-xs text-sage">{filtered.length} of {expenses.length}</p>
            </div>
            <label className="relative block sm:w-72">
              <span className="sr-only">Search expenses</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sage" />
              <input className="h-11 w-full border border-line bg-cream pl-10 pr-3 text-sm text-ink outline-none placeholder:text-sage/70 focus-visible:ring-2 focus-visible:ring-brand" value={query} placeholder="Description, supplier, or receipt" onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto">
            <Chip active={!status} onClick={() => setStatus('')}>All</Chip>
            {statuses.map((item) => <Chip key={item} active={status === item} onClick={() => setStatus(item)}>{item}</Chip>)}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            <Chip active={!category} onClick={() => setCategory('')}>Any category</Chip>
            {categoryOptions.map((item) => <Chip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</Chip>)}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-sage">{expenses.length === 0 ? 'No expenses on record yet.' : 'No expenses match that search.'}</p>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((item) => {
              const open = openId === item.id
              return (
                <li key={item.id}>
                  <button type="button" className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-cream sm:px-5" aria-expanded={open} onClick={() => setOpenId(open ? null : item.id)}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{item.description}</span>
                      <span className="mt-0.5 block truncate text-xs text-sage">{item.category} · {campaignTitle.get(item.campaignId ?? '') ?? 'General'} · {formatDate(item.date)}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-sm font-semibold tabular-nums text-ink">{formatUGX(item.amount)}</span>
                      <StatusPill value={item.status} />
                    </span>
                  </button>
                  {open ? (
                    <div className="border-t border-line bg-cream px-4 py-4 sm:px-5">
                      <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Supplier</dt><dd className="mt-1 text-ink">{item.supplier || '—'}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Receipt</dt><dd className="mt-1 font-mono text-xs text-ink">{item.receipt || '—'}</dd></div>
                      </dl>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button type="button" className="inline-flex h-11 items-center justify-center border border-line bg-white px-4 text-sm font-semibold text-forest" onClick={() => { setEditing(item.id); setCreating(false); fill(item); setError(''); setNotice('') }}>Edit</button>
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
    <button type="button" className={`h-9 shrink-0 px-3 text-xs font-semibold capitalize ${active ? 'bg-brand text-white' : 'border border-line bg-white text-forest'}`} onClick={onClick}>{children}</button>
  )
}
