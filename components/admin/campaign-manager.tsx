'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { deleteCampaign, updateCampaign } from '@/lib/admin-actions'
import { createCampaign, updateCampaignStatus } from '@/lib/actions'
import { formatUGX, percentOf } from '@/lib/format'
import type { Campaign, CampaignStatus, EducationLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

const statuses: CampaignStatus[] = ['draft', 'active', 'paused', 'completed', 'archived']
const levels: EducationLevel[] = ['Nursery', 'Primary', 'Secondary', 'University']

type BeneficiaryOption = { id: string; name: string }

type FormState = {
  title: string
  slug: string
  summary: string
  description: string
  category: string
  level: EducationLevel
  location: string
  target: string
  start: string
  end: string
  image: string
  gallery: string
  video: string
  seoTitle: string
  seoDescription: string
  status: CampaignStatus
  beneficiaryId: string
}

const blank: FormState = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  category: 'School Fees',
  level: 'Primary',
  location: 'Kampala',
  target: '1000000',
  start: new Date().toISOString().slice(0, 10),
  end: '',
  image: '/school-pesa-hero.png',
  gallery: '',
  video: '',
  seoTitle: '',
  seoDescription: '',
  status: 'draft',
  beneficiaryId: '',
}

function showDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formFrom(item: Campaign): FormState {
  return {
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    description: item.description,
    category: item.category,
    level: item.level,
    location: item.location,
    target: String(item.target),
    start: item.createdAt.slice(0, 10),
    end: item.deadline.slice(0, 10),
    image: item.image,
    gallery: item.gallery.join('\n'),
    video: item.video ?? '',
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    status: item.status,
    beneficiaryId: item.beneficiaryId ?? '',
  }
}

export function CampaignManager({ initial, beneficiaries }: { initial: Campaign[]; beneficiaries: BeneficiaryOption[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  const [statusId, setStatusId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<Campaign | null>(null)
  useEffect(() => { setRows(initial) }, [initial])

  useEffect(() => {
    if (!open && !removing) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open, removing])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return rows.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false
      if (!term) return true
      return [item.title, item.category, item.location, item.slug].join(' ').toLowerCase().includes(term)
    })
  }, [rows, query, filter])

  const raised = rows.reduce((sum, item) => sum + item.raised, 0)
  const active = rows.filter((item) => item.status === 'active').length

  function closeForm() {
    setOpen(false)
    setEditing(null)
    setForm(blank)
    setError('')
  }

  function edit(item: Campaign) {
    setEditing(item.id)
    setForm(formFrom(item))
    setError('')
    setNotice('')
    setOpen(true)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    const payload = {
      title: form.title,
      slug: form.slug,
      summary: form.summary,
      description: form.description,
      category: form.category,
      level: form.level,
      location: form.location,
      target: Number(form.target) || 0,
      deadline: form.end,
      createdAt: form.start,
      image: form.image,
      gallery: form.gallery,
      video: form.video,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      status: form.status,
      beneficiaryId: form.beneficiaryId || undefined,
    }
    try {
      if (editing) await updateCampaign(editing, payload)
      else await createCampaign(payload)
      setNotice(editing ? 'Campaign updated.' : 'Campaign created.')
      closeForm()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The campaign could not be saved.')
    } finally {
      setPending(false)
    }
  }

  async function changeStatus(item: Campaign, status: CampaignStatus) {
    if (status === item.status) return
    setStatusId(item.id)
    setError('')
    setNotice('')
    try {
      await updateCampaignStatus(item.id, status)
      setNotice(`${item.title} is now ${status}.`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The status could not be saved.')
    } finally {
      setStatusId(null)
    }
  }

  async function confirmRemove() {
    if (!removing) return
    setPending(true)
    setError('')
    try {
      await deleteCampaign(removing.id)
      setNotice('Campaign removed.')
      setRemoving(null)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The campaign could not be removed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Fundraising</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-ink sm:text-4xl">Campaigns</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-sage">Create, update, and publish campaigns. Every change is written to the campaign records.</p>
        </div>
        <Button className="h-11 w-full rounded-full bg-forest px-5 text-white hover:bg-brand-deep sm:w-auto" onClick={() => { setEditing(null); setForm(blank); setError(''); setOpen(true) }}>New campaign</Button>
      </header>

      <section className="mt-6 grid grid-cols-2 border border-line bg-white sm:grid-cols-4" aria-label="Campaign summary">
        {[
          ['On record', String(rows.length)],
          ['Active', String(active)],
          ['Showing', String(visible.length)],
          ['Raised', formatUGX(raised)],
        ].map(([label, value]) => (
          <div key={label} className="border-b border-line p-4 odd:border-r sm:border-b-0 sm:border-r sm:last:border-r-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
          </div>
        ))}
      </section>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search campaigns</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sage" />
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, place, or category" />
        </label>
      </div>
      <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter by status">
        {(['all', ...statuses] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            onClick={() => setFilter(item)}
            className={cn('h-10 shrink-0 rounded-full px-3 text-sm font-semibold capitalize', filter === item ? 'bg-forest text-white' : 'border border-line bg-white text-ink')}
          >
            {item === 'all' ? 'All' : item}
          </button>
        ))}
      </div>

      {notice ? <p role="status" className="mt-4 text-sm text-forest">{notice}</p> : null}
      {error && !open ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}

      {visible.length === 0 ? (
        <p className="mt-6 border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-sage">
          {rows.length === 0 ? 'No campaigns yet. Create the first one.' : 'No campaigns match this search.'}
        </p>
      ) : (
        <>
          <ul className="mt-4 grid gap-3 lg:hidden">
            {visible.map((item) => (
              <li key={item.id}>
                <CampaignCard item={item} busy={statusId === item.id} onEdit={() => edit(item)} onStatus={(status) => void changeStatus(item, status)} onDelete={() => setRemoving(item)} />
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-hidden border border-line bg-white lg:block">
            <table className="w-full text-left">
              <thead className="border-b border-line bg-cream">
                <tr>
                  {['Campaign', 'Progress', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const progress = percentOf(item.raised, item.target)
                  return (
                    <tr key={item.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{item.title}</p>
                        <p className="text-xs text-sage">{item.category} · {item.location} · ends {showDate(item.deadline)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-ink">{formatUGX(item.raised)} <span className="font-normal text-sage">of {formatUGX(item.target)}</span></p>
                        <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-mist">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-sage">{progress}% · {item.donors} donors</p>
                      </td>
                      <td className="px-4 py-3">
                        <Select className="h-10 w-36 capitalize" aria-label={`Status for ${item.title}`} value={item.status} disabled={statusId === item.id} onChange={(event) => void changeStatus(item, event.target.value as CampaignStatus)}>
                          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/campaigns/${item.slug}`} className="inline-flex h-10 items-center rounded-full border border-line px-3 text-sm font-semibold text-forest">View</Link>
                          <button type="button" className="h-10 rounded-full border border-line px-3 text-sm font-semibold text-ink" onClick={() => edit(item)}>Edit</button>
                          <button type="button" className="h-10 rounded-full px-3 text-sm font-semibold text-destructive" onClick={() => setRemoving(item)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/40 sm:items-center sm:justify-center sm:p-6" onClick={closeForm}>
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-form-title"
            className="flex max-h-[94vh] w-full flex-col bg-white sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
            onSubmit={save}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 id="campaign-form-title" className="text-lg font-semibold text-ink">{editing ? 'Edit campaign' : 'New campaign'}</h2>
              <button type="button" className="grid size-11 place-items-center rounded-full text-ink" aria-label="Close" onClick={closeForm}><X className="size-5" /></button>
            </div>
            <div className="grid gap-4 overflow-y-auto px-4 py-4 sm:grid-cols-2">
              <Label className="sm:col-span-2">Title<Input className="mt-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></Label>
              <Label className="sm:col-span-2">Address<Input className="mt-2" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Leave blank to build it from the title" /></Label>
              <Label className="sm:col-span-2">Short description<Textarea className="mt-2" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></Label>
              <Label className="sm:col-span-2">Full description<Textarea className="mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Label>
              <Label>Category<Input className="mt-2" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Label>
              <Label>Education level
                <Select className="mt-2" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as EducationLevel })}>
                  {levels.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </Label>
              <Label>Learner
                <Select className="mt-2" value={form.beneficiaryId} onChange={(event) => setForm({ ...form, beneficiaryId: event.target.value })}>
                  <option value="">None</option>
                  {beneficiaries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </Label>
              <Label>Location<Input className="mt-2" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></Label>
              <Label>Target (UGX)<Input className="mt-2" inputMode="numeric" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} required /></Label>
              <Label>Status
                <Select className="mt-2" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CampaignStatus })}>
                  {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </Label>
              <Label>Start date<Input className="mt-2" type="date" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} required /></Label>
              <Label>End date<Input className="mt-2" type="date" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} required /></Label>
              <Label className="sm:col-span-2">Cover image<Input className="mt-2" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></Label>
              <Label className="sm:col-span-2">Gallery<Textarea className="mt-2" value={form.gallery} onChange={(event) => setForm({ ...form, gallery: event.target.value })} placeholder="One image address per line" /></Label>
              <Label className="sm:col-span-2">Video<Input className="mt-2" value={form.video} onChange={(event) => setForm({ ...form, video: event.target.value })} /></Label>
              <Label>SEO title<Input className="mt-2" value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} /></Label>
              <Label>SEO description<Textarea className="mt-2" value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} /></Label>
              {error ? <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
            </div>
            <div className="flex gap-2 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button type="button" variant="outline" className="h-11 flex-1 rounded-full" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="h-11 flex-1 rounded-full bg-forest text-white hover:bg-brand-deep" disabled={pending}>{pending ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </div>
      ) : null}

      <Dialog open={Boolean(removing)} title="Remove campaign" onClose={() => { if (!pending) setRemoving(null) }}>
        <p className="text-sm leading-6 text-sage">Remove “{removing?.title}”? Gifts, stories, and expenses stay on record. The campaign leaves the public site.</p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-11 rounded-full" disabled={pending} onClick={() => setRemoving(null)}>Keep campaign</Button>
          <Button type="button" variant="destructive" className="h-11 rounded-full" disabled={pending} onClick={() => void confirmRemove()}>{pending ? 'Removing…' : 'Remove campaign'}</Button>
        </div>
      </Dialog>
    </div>
  )
}

function CampaignCard({ item, busy, onEdit, onStatus, onDelete }: { item: Campaign; busy: boolean; onEdit: () => void; onStatus: (status: CampaignStatus) => void; onDelete: () => void }) {
  const progress = percentOf(item.raised, item.target)
  return (
    <article className="border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">{item.title}</h2>
          <p className="mt-1 text-xs text-sage">{item.category} · {item.location}</p>
        </div>
        <StatusPill value={item.status} />
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-mist">
        <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-sm text-ink">{formatUGX(item.raised)} <span className="text-sage">of {formatUGX(item.target)} · {progress}%</span></p>
      <p className="mt-1 text-xs text-sage">{item.donors} donors · ends {showDate(item.deadline)}</p>
      <Label className="mt-4 block text-xs">Status
        <Select className="mt-2 h-11 capitalize" aria-label={`Status for ${item.title}`} value={item.status} disabled={busy} onChange={(event) => onStatus(event.target.value as CampaignStatus)}>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </Select>
      </Label>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Link href={`/campaigns/${item.slug}`} className="inline-flex h-11 items-center justify-center rounded-full border border-line text-sm font-semibold text-forest">View</Link>
        <button type="button" className="h-11 rounded-full border border-line text-sm font-semibold text-ink" onClick={onEdit}>Edit</button>
        <button type="button" className="h-11 rounded-full text-sm font-semibold text-destructive" onClick={onDelete}>Delete</button>
      </div>
    </article>
  )
}
