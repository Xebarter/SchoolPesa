'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { CampaignProgress } from '@/components/campaign-progress'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { deleteBeneficiary, saveBeneficiary } from '@/lib/admin-actions'
import { formatUGX, percentOf } from '@/lib/format'
import type { Beneficiary, EducationLevel } from '@/lib/types'

type LearnerStatus = 'active' | 'paused' | 'completed'

const levels: EducationLevel[] = ['Nursery', 'Primary', 'Secondary', 'University']
const statuses: LearnerStatus[] = ['active', 'paused', 'completed']

type FormState = {
  displayName: string
  level: EducationLevel
  school: string
  location: string
  needs: string
  story: string
  target: string
  image: string
  status: LearnerStatus
  publicProfile: boolean
  publicImage: boolean
  storyVisible: boolean
}

const blank: FormState = {
  displayName: '',
  level: 'Primary',
  school: '',
  location: '',
  needs: '',
  story: '',
  target: '',
  image: '',
  status: 'active',
  publicProfile: false,
  publicImage: false,
  storyVisible: false,
}

const field = 'mt-2 rounded-none'

export function BeneficiaryManager({ initial }: { initial: Beneficiary[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(blank)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('')
  const [status, setStatus] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { setRows(initial) }, [initial])
  useEffect(() => {
    if (creating || editing) document.getElementById('learner-form')?.scrollIntoView({ block: 'nearest' })
  }, [creating, editing])

  const filtered = rows.filter((item) => {
    const haystack = `${item.displayName} ${item.school} ${item.location} ${item.needs}`.toLowerCase()
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false
    if (level && item.level !== level) return false
    if (status && item.status !== status) return false
    return true
  })
  const raised = rows.reduce((sum, item) => sum + item.raised, 0)
  const figures = [
    [String(rows.length), 'On record'],
    [String(rows.filter((item) => item.publicProfile).length), 'Public'],
    [String(rows.filter((item) => item.status === 'active').length), 'Active'],
    [formatUGX(raised), 'Raised'],
  ]

  function fill(item: Beneficiary) {
    setForm({
      displayName: item.displayName,
      level: item.level,
      school: item.school,
      location: item.location,
      needs: item.needs,
      story: item.story,
      target: String(item.target),
      image: item.image,
      status: item.status,
      publicProfile: item.publicProfile,
      publicImage: item.publicImage,
      storyVisible: item.storyVisible,
    })
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
    setForm(blank)
  }

  async function save() {
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      await saveBeneficiary({
        id: editing ?? undefined,
        displayName: form.displayName,
        level: form.level,
        school: form.school,
        location: form.location,
        needs: form.needs,
        story: form.story,
        target: Number(form.target) || 0,
        image: form.image,
        status: form.status,
        publicProfile: form.publicProfile,
        publicImage: form.publicImage,
        storyVisible: form.storyVisible,
      })
      setNotice(editing ? 'Learner updated.' : 'Learner added.')
      closeForm()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The learner could not be saved.')
    } finally {
      setPending(false)
    }
  }

  async function remove(id: string) {
    setPending(true)
    setError('')
    setNotice('')
    try {
      await deleteBeneficiary(id)
      setConfirming(null)
      if (editing === id) closeForm()
      setNotice('Learner removed.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The learner could not be removed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Learners</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-ink sm:mt-3 sm:text-5xl">Beneficiaries</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-sage sm:mt-3">Profiles used for sponsorship. A new learner stays off the public site until you mark the profile public.</p>
        </div>
        <button type="button" className="inline-flex h-11 items-center justify-center gap-2 bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep" aria-expanded={creating} onClick={() => { setCreating((value) => !value); setEditing(null); setForm(blank) }}>
          <Plus className="size-4" />
          {creating ? 'Close form' : 'New learner'}
        </button>
      </header>

      <section className="mt-6 grid overflow-hidden border border-line bg-white sm:grid-cols-2 xl:grid-cols-4" aria-label="Learner summary">
        {figures.map(([value, label]) => (
          <div key={label} className="border-b border-line p-4 last:border-b-0 sm:p-5 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-.04em] text-ink sm:text-3xl">{value}</p>
          </div>
        ))}
      </section>

      {(notice || error) ? (
        <p className={`mt-4 border px-4 py-3 text-sm ${error ? 'border-[#e7cfc7] bg-[#f8ece8] text-[#8d4b38]' : 'border-line bg-white text-ink'}`} role={error ? 'alert' : 'status'}>{error || notice}</p>
      ) : null}

      {(creating || editing) ? (
        <form id="learner-form" className="mt-4 border border-line bg-white p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); void save() }}>
          <h2 className="text-sm font-semibold text-ink">{editing ? 'Edit learner' : 'New learner'}</h2>
          <p className="mt-1 text-xs leading-5 text-sage">Name, school, and a target. Privacy stays off until you turn it on.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Label>Display name<Input className={field} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required /></Label>
            <Label>Education level
              <Select className={field} value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as EducationLevel })}>
                {levels.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>School or program<Input className={field} value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })} /></Label>
            <Label>General location<Input className={field} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></Label>
            <Label>Target (UGX)<Input className={field} inputMode="numeric" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} /></Label>
            <Label>Status
              <Select className={field} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as LearnerStatus })}>
                {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Label>
            <Label className="sm:col-span-2">Needs<Input className={field} value={form.needs} onChange={(event) => setForm({ ...form, needs: event.target.value })} /></Label>
            <Label className="sm:col-span-2">Story<Textarea className={`${field} min-h-28`} value={form.story} onChange={(event) => setForm({ ...form, story: event.target.value })} /></Label>
            <Label className="sm:col-span-2">Photo address<Input className={field} value={form.image} placeholder="Leave blank to keep the current photo" onChange={(event) => setForm({ ...form, image: event.target.value })} /></Label>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Toggle label="Public profile" hint="Listed on the sponsor page" checked={form.publicProfile} onChange={(checked) => setForm({ ...form, publicProfile: checked })} />
            <Toggle label="Public photo" hint="Shown on the public profile" checked={form.publicImage} onChange={(checked) => setForm({ ...form, publicImage: checked })} />
            <Toggle label="Story visible" hint="Story text on the public profile" checked={form.storyVisible} onChange={(checked) => setForm({ ...form, storyVisible: checked })} />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="submit" className="inline-flex h-11 items-center justify-center bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-60" disabled={pending}>{pending ? 'Saving…' : editing ? 'Update learner' : 'Save learner'}</button>
            <button type="button" className="inline-flex h-11 items-center justify-center border border-line bg-white px-5 text-sm font-semibold text-forest" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      ) : null}

      <div className="mt-6">
        <label className="relative block">
          <span className="sr-only">Search learners</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sage" />
          <input className="h-11 w-full border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none placeholder:text-sage/70 focus-visible:ring-2 focus-visible:ring-brand" value={query} placeholder="Name, school, or place" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip active={!level} onClick={() => setLevel('')}>All levels</Chip>
          {levels.map((item) => <Chip key={item} active={level === item} onClick={() => setLevel(item)}>{item}</Chip>)}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip active={!status} onClick={() => setStatus('')}>Any status</Chip>
          {statuses.map((item) => <Chip key={item} active={status === item} onClick={() => setStatus(item)}>{item}</Chip>)}
        </div>
      </div>

      <ul className="mt-4 grid gap-3">
        {filtered.map((item) => {
          const initialLetter = item.displayName.trim().charAt(0).toUpperCase() || '•'
          return (
            <li key={item.id} className="border border-line bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                {item.image ? (
                  <Image src={item.image} alt="" width={48} height={48} className="size-12 shrink-0 object-cover" />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center bg-cream text-sm font-semibold text-forest">{initialLetter}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{item.displayName}</p>
                    <StatusPill value={item.status} />
                    <StatusPill value={item.publicProfile ? 'Public' : 'Private'} />
                  </div>
                  <p className="mt-1 text-xs leading-5 text-sage">{[item.level, item.school, item.location].filter(Boolean).join(' · ') || 'No school recorded'}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-sage">
                  <span>{formatUGX(item.raised)} raised</span>
                  <span>{percentOf(item.raised, item.target)}% of {formatUGX(item.target)}</span>
                </div>
                <CampaignProgress raised={item.raised} target={item.target} />
              </div>
              {item.needs ? <p className="mt-3 text-sm leading-6 text-ink">{item.needs}</p> : null}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button type="button" className="inline-flex h-11 items-center justify-center border border-line px-4 text-sm font-semibold text-forest" onClick={() => { setEditing(item.id); setCreating(false); fill(item) }}>Edit</button>
                {item.publicProfile ? (
                  <Link href={`/sponsor/${item.id}`} className="inline-flex h-11 items-center justify-center border border-line px-4 text-sm font-semibold text-forest">Public profile</Link>
                ) : null}
                {confirming === item.id ? (
                  <>
                    <button type="button" className="inline-flex h-11 items-center justify-center bg-[#8d4b38] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} onClick={() => void remove(item.id)}>Confirm remove</button>
                    <button type="button" className="inline-flex h-11 items-center justify-center px-4 text-sm font-semibold text-sage" onClick={() => setConfirming(null)}>Keep</button>
                  </>
                ) : (
                  <button type="button" className="inline-flex h-11 items-center justify-center px-4 text-sm font-semibold text-[#8d4b38]" onClick={() => setConfirming(item.id)}>Remove</button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {filtered.length === 0 ? <p className="mt-4 border border-line bg-white px-4 py-8 text-sm text-sage">{rows.length === 0 ? 'No learners on record yet.' : 'No learners match that search.'}</p> : null}
    </div>
  )
}

function Chip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" className={`h-9 px-3 text-xs font-semibold capitalize ${active ? 'bg-brand text-white' : 'border border-line bg-white text-forest'}`} onClick={onClick}>{children}</button>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 border border-line px-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-sage">{hint}</span>
      </span>
      <input className="size-4 shrink-0 accent-forest" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}
