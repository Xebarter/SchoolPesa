'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ImagePlus, Search, Upload, X } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { ImageUploadProgress } from '@/components/ui/image-upload-progress'
import { uploadWithProgress } from '@/lib/image-upload-client'
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
  image: '',
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
  const coverRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState(initial)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState('')
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

  function resetForm() {
    setOpen(false)
    setEditing(null)
    setForm(blank)
    setError('')
    setUploadProgress(null)
    setUploadSuccess('')
  }

  function closeForm() {
    if (pending || uploadingCover) return
    resetForm()
    setNotice('')
  }

  function edit(item: Campaign) {
    setEditing(item.id)
    setForm(formFrom(item))
    setError('')
    setNotice('')
    setUploadProgress(null)
    setUploadSuccess('')
    setOpen(true)
  }

  async function onCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || uploadingCover) return
    setUploadingCover(true)
    setError('')
    setNotice('')
    setUploadSuccess('')
    const data = new FormData()
    data.set('purpose', 'cover')
    data.set('entity', 'campaign')
    data.set('image', file)
    try {
      setUploadProgress(0)
      const response = await uploadWithProgress('/api/admin/images', data, setUploadProgress)
      if (typeof response.image !== 'string' || !response.image.startsWith('/media/gallery/')) {
        throw new Error('The server returned an invalid image path.')
      }
      const image = response.image
      setForm((current) => ({ ...current, image }))
      setUploadProgress(null)
      setUploadSuccess('Image uploaded successfully. Save the campaign to apply it.')
    } catch (caught) {
      setUploadProgress(null)
      setError(caught instanceof Error ? caught.message : 'The cover image could not be uploaded.')
    } finally {
      setUploadingCover(false)
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (pending || uploadingCover) return
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
      resetForm()
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
        <Button className="h-11 w-full rounded-full bg-forest px-5 text-white hover:bg-brand-deep sm:w-auto" disabled={pending || uploadingCover} onClick={() => { setEditing(null); setForm(blank); setError(''); setNotice(''); setUploadProgress(null); setUploadSuccess(''); setOpen(true) }}>New campaign</Button>
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
        <ul className="mt-4 grid gap-3">
          {visible.map((item) => (
            <li key={item.id}>
              <CampaignStrip item={item} busy={statusId === item.id} onEdit={() => edit(item)} onStatus={(status) => void changeStatus(item, status)} onDelete={() => setRemoving(item)} />
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/40 sm:items-center sm:justify-center sm:p-6" onClick={() => closeForm()}>
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-form-title"
            className="flex max-h-[94vh] w-full flex-col bg-white sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
            onSubmit={save}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <h2 id="campaign-form-title" className="text-lg font-semibold text-ink">{editing ? 'Edit campaign' : 'New campaign'}</h2>
                <p className="mt-0.5 text-xs text-sage">Update the campaign details and cover image.</p>
              </div>
              <button type="button" className="grid size-11 place-items-center rounded-full text-ink disabled:opacity-50" aria-label="Close" onClick={() => closeForm()} disabled={pending || uploadingCover}><X className="size-5" /></button>
            </div>
            <div className="grid gap-4 overflow-y-auto px-4 py-4 sm:grid-cols-2 sm:px-6">
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
              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>Campaign cover</Label>
                  <span className="text-xs text-sage">JPG, PNG, WebP, or GIF · up to 8 MB</span>
                </div>
                <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" aria-label="Upload campaign cover image" onChange={(event) => void onCoverChange(event)} />
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-line bg-cream sm:aspect-auto sm:min-h-36">
                    {form.image && !form.image.startsWith('//') ? (
                      <Image src={form.image} alt="Campaign cover preview" fill className="object-cover" sizes="(max-width: 640px) 100vw, 400px" />
                    ) : (
                      <div className="grid size-full min-h-36 place-items-center text-sage">
                        <span className="text-center"><ImagePlus className="mx-auto size-7" /><span className="mt-2 block text-xs">No cover image selected</span></span>
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-full bg-ink/75 px-2.5 py-1 text-[10px] font-semibold text-white">Cover preview</span>
                  </div>
                  <div className="flex flex-col justify-center rounded-xl border border-dashed border-line bg-cream/50 p-4">
                    <Upload className="size-5 text-brand" />
                    <p className="mt-2 text-sm font-semibold text-ink">Choose a campaign photo</p>
                    <p className="mt-1 text-xs leading-5 text-sage">Upload a clear image to help donors recognize this campaign.</p>
                    <Button type="button" variant="outline" className="mt-3 h-10 rounded-full" onClick={() => coverRef.current?.click()} disabled={uploadingCover || pending}>
                      {uploadingCover ? 'Uploading…' : form.image ? 'Replace image' : 'Upload image'}
                    </Button>
                  </div>
                </div>
                <ImageUploadProgress progress={uploadProgress} success={uploadProgress === null ? uploadSuccess : undefined} />
              </div>
              <Label className="sm:col-span-2">Additional gallery image paths<Textarea className="mt-2" value={form.gallery} onChange={(event) => setForm({ ...form, gallery: event.target.value })} placeholder="One path per line, if needed" /><span className="mt-1 block text-xs font-normal text-sage">Optional secondary images only. Upload the campaign cover above.</span></Label>
              <Label className="sm:col-span-2">Video<Input className="mt-2" value={form.video} onChange={(event) => setForm({ ...form, video: event.target.value })} /></Label>
              <Label>SEO title<Input className="mt-2" value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} /></Label>
              <Label>SEO description<Textarea className="mt-2" value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} /></Label>
              {error ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive sm:col-span-2">{error}</p> : null}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
              <p className="hidden text-xs text-sage sm:block">{uploadingCover ? 'Uploading image…' : 'Your changes are saved when you submit.'}</p>
              <div className="ml-auto flex w-full gap-2 sm:w-auto">
                <Button type="button" variant="outline" className="h-11 flex-1 rounded-full sm:flex-none" onClick={() => closeForm()} disabled={pending || uploadingCover}>Cancel</Button>
                <Button type="submit" className="h-11 flex-1 rounded-full bg-forest text-white hover:bg-brand-deep sm:flex-none" disabled={pending || uploadingCover}>{pending ? 'Saving…' : editing ? 'Save changes' : 'Create campaign'}</Button>
              </div>
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

function CampaignStrip({ item, busy, onEdit, onStatus, onDelete }: { item: Campaign; busy: boolean; onEdit: () => void; onStatus: (status: CampaignStatus) => void; onDelete: () => void }) {
  const progress = percentOf(item.raised, item.target)
  return (
    <article className="grid grid-cols-[6rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-sm sm:grid-cols-[9rem_minmax(0,1fr)] lg:grid-cols-[11rem_minmax(0,1fr)_auto]">
      <div className="relative aspect-square bg-cream lg:aspect-auto">
        <Image
          src={item.image || '/school-pesa-hero.png'}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 176px"
        />
      </div>
      <div className="min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill value={item.status} />
              <span className="text-xs text-sage">{item.category} · {item.location}</span>
            </div>
            <h2 className="mt-2 text-base font-semibold leading-6 text-ink sm:text-lg">{item.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-sage">{item.summary || item.description}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <p className="font-semibold text-ink">{formatUGX(item.raised)} <span className="font-normal text-sage">raised</span></p>
            <p className="text-xs text-sage">{progress}% of {formatUGX(item.target)}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist" role="progressbar" aria-label={`Funding progress for ${item.title}`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-sage">{item.donors} donors · closes {showDate(item.deadline)}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 lg:hidden">
          <Select className="h-10 w-36 capitalize" aria-label={`Status for ${item.title}`} value={item.status} disabled={busy} onChange={(event) => onStatus(event.target.value as CampaignStatus)}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </Select>
          <Link href={`/campaigns/${item.slug}`} className="inline-flex h-10 items-center rounded-full border border-line px-3 text-sm font-semibold text-forest">View</Link>
          <button type="button" className="h-10 rounded-full border border-line px-3 text-sm font-semibold text-ink" onClick={onEdit}>Edit</button>
          <button type="button" className="h-10 rounded-full px-3 text-sm font-semibold text-destructive" onClick={onDelete}>Delete</button>
        </div>
      </div>
      <div className="hidden items-center gap-2 p-4 lg:flex">
        <Select className="h-10 w-36 capitalize" aria-label={`Status for ${item.title}`} value={item.status} disabled={busy} onChange={(event) => onStatus(event.target.value as CampaignStatus)}>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </Select>
        <Link href={`/campaigns/${item.slug}`} className="inline-flex h-10 items-center rounded-full border border-line px-3 text-sm font-semibold text-forest">View</Link>
        <button type="button" className="h-10 rounded-full border border-line px-3 text-sm font-semibold text-ink" onClick={onEdit}>Edit</button>
        <button type="button" className="h-10 rounded-full px-3 text-sm font-semibold text-destructive" onClick={onDelete}>Delete</button>
      </div>
    </article>
  )
}
