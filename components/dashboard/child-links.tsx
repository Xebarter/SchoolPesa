'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus, Search } from 'lucide-react'
import { CampaignProgress } from '@/components/campaign-progress'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { createDonorLearner, deleteDonorLearner, hideSponsorship, saveSponsorship, updateDonorLearner } from '@/lib/donor-actions'
import { formatUGX, percentOf } from '@/lib/format'
import type { Beneficiary, DonorLearnerInput, EducationLevel } from '@/lib/types'

type LearnerStatus = 'active' | 'paused' | 'completed'

const levels: EducationLevel[] = ['Nursery', 'Primary', 'Secondary', 'University']
const statuses: LearnerStatus[] = ['active', 'paused', 'completed']

const blank: DonorLearnerInput = {
  displayName: '',
  level: 'Primary',
  school: '',
  location: '',
  needs: '',
  story: '',
  target: 0,
  status: 'active',
  publicProfile: false,
  publicImage: false,
  storyVisible: false,
}

export function ChildLinks({ saved, learners, owned }: { saved: (Beneficiary & { note: string })[]; learners: Beneficiary[]; owned: Beneficiary[] }) {
  const router = useRouter()
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('')

  const ownedIds = new Set(owned.map((item) => item.id))
  const sponsoring = saved.filter((item) => !ownedIds.has(item.id))
  const followed = new Set([...saved.map((item) => item.id), ...ownedIds])
  const available = learners.filter((item) => item.publicProfile && !followed.has(item.id))
  const matches = available.filter((item) => {
    const haystack = `${item.displayName} ${item.school} ${item.location} ${item.needs}`.toLowerCase()
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false
    if (level && item.level !== level) return false
    return true
  })

  useEffect(() => {
    if (creating || editing) document.getElementById('learner-form')?.scrollIntoView({ block: 'nearest' })
  }, [creating, editing])

  const savedNote = new Map(saved.map((item) => [item.id, item.note]))
  const yours = [...owned.map((item) => ({ ...item, note: savedNote.get(item.id) ?? '', owned: true as const })), ...sponsoring.map((item) => ({ ...item, owned: false as const }))]
  const active = yours.filter((item) => item.status === 'active').length
  const raised = yours.reduce((sum, item) => sum + item.raised, 0)
  const figures = [
    [String(yours.length), 'Sponsored'],
    [String(active), 'Active'],
    [formatUGX(raised), 'Raised'],
  ]

  async function run(id: string, work: () => Promise<void>, done: string) {
    setError('')
    setNotice('')
    setPendingId(id)
    try {
      await work()
      setNotice(done)
      setConfirming(null)
      setOpenId(null)
      router.refresh()
      return true
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The sponsorship list could not be updated.')
      return false
    } finally {
      setPendingId(null)
    }
  }

  function fill(item: Beneficiary) {
    setForm({
      displayName: item.displayName,
      level: item.level,
      school: item.school,
      location: item.location,
      needs: item.needs,
      story: item.story,
      target: item.target,
      status: item.status,
      publicProfile: item.publicProfile,
      publicImage: item.publicImage,
      storyVisible: item.storyVisible,
    })
  }

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Your learners</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-ink sm:text-5xl">Sponsored</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-sage">Keep the learners you support in one place, with their progress and a private note.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-semibold text-forest hover:border-forest" aria-expanded={creating} onClick={() => { setCreating((value) => !value); setEditing(null); setForm(blank) }}>
            {creating ? 'Close' : 'New learner'}
          </button>
          <Link href="/sponsor" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep">
            Browse <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-3 overflow-hidden border border-line bg-white" aria-label="Sponsorship summary">
        {figures.map(([value, label]) => (
          <div key={label} className="min-w-0 border-r border-line p-3 last:border-r-0 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sage sm:text-[11px] sm:tracking-[0.16em]">{label}</p>
            <p className="mt-2 truncate text-lg font-semibold tracking-[-.04em] text-ink sm:mt-3 sm:text-3xl">{value}</p>
          </div>
        ))}
      </section>

      {notice ? <p className="mt-4 border border-line bg-white px-4 py-3 text-sm font-medium text-forest" role="status">{notice}</p> : null}
      {error ? <p className="mt-4 border border-line bg-white px-4 py-3 text-sm text-destructive" role="alert">{error}</p> : null}

      {(creating || editing) ? (
        <form
          id="learner-form"
          className="mt-6 grid gap-4 border border-line bg-white p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault()
            const payload = { ...form, target: Number(form.target) || 0 }
            void run(editing ?? 'new', () => editing ? updateDonorLearner(editing, payload) : createDonorLearner(payload), editing ? 'Learner updated.' : 'Learner created.').then((ok) => {
              if (!ok) return
              setCreating(false)
              setEditing(null)
              setForm(blank)
            })
          }}
        >
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">{editing ? 'Edit learner' : 'New learner'}</h2>
            <p className="mt-1 text-sm leading-6 text-sage">Use a display name. The profile stays off the public site until you choose otherwise.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label className="sm:col-span-2">Display name<Input className="mt-2" required value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></Label>
            <Label>School<Input className="mt-2" value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })} /></Label>
            <Label>Location<Input className="mt-2" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></Label>
            <Label>Education level
              <Select className="mt-2" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>
                {levels.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>Status
              <Select className="mt-2" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as LearnerStatus })}>
                {statuses.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>Needs<Input className="mt-2" value={form.needs} onChange={(event) => setForm({ ...form, needs: event.target.value })} /></Label>
            <Label>Target (UGX)<Input className="mt-2" inputMode="numeric" value={form.target ? String(form.target) : ''} onChange={(event) => setForm({ ...form, target: Number(event.target.value.replace(/[^\d]/g, '')) || 0 })} /></Label>
            <Label className="sm:col-span-2">Story<Textarea className="mt-2" value={form.story} onChange={(event) => setForm({ ...form, story: event.target.value })} /></Label>
          </div>
          <fieldset className="grid gap-2 sm:grid-cols-3">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-sage">Visibility</legend>
            <Toggle label="Public profile" hint="Listed on the sponsor page" checked={form.publicProfile} onChange={(checked) => setForm({ ...form, publicProfile: checked })} />
            <Toggle label="Public image" hint="Photo can be shown" checked={form.publicImage} onChange={(checked) => setForm({ ...form, publicImage: checked })} />
            <Toggle label="Story visible" hint="Story can be read publicly" checked={form.storyVisible} onChange={(checked) => setForm({ ...form, storyVisible: checked })} />
          </fieldset>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-50" disabled={pendingId === (editing ?? 'new')}>
              {pendingId === (editing ?? 'new') ? 'Saving…' : editing ? 'Save changes' : 'Create learner'}
            </button>
            <button type="button" className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-forest" onClick={() => { setCreating(false); setEditing(null); setForm(blank) }}>Cancel</button>
          </div>
        </form>
      ) : null}

      <section className="mt-8" aria-labelledby="your-learners-title">
        <h2 id="your-learners-title" className="text-lg font-semibold tracking-tight text-ink">Learners you support</h2>
        {yours.length === 0 ? (
          <div className="mt-3 border border-line bg-white px-5 py-14 text-center">
            <p className="text-lg font-semibold tracking-tight text-ink">No learners on this account yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-sage">Sponsor a public profile below, or create a private one for someone you already support.</p>
            <button type="button" className="mt-5 inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep" onClick={() => document.getElementById('find-learner')?.scrollIntoView({ block: 'nearest' })}>Find a learner</button>
          </div>
        ) : (
          <ul className="mt-3 border border-line bg-white">
            {yours.map((item) => {
              const percent = percentOf(item.raised, item.target)
              const open = openId === item.id
              const busy = pendingId === item.id
              const note = notes[item.id] ?? item.note
              const showPhoto = item.owned || item.publicImage
              return (
                <li key={item.id} className="border-b border-line last:border-b-0">
                  <div className="sm:grid sm:grid-cols-[9.5rem_1fr]">
                    <div className="relative aspect-[16/9] bg-cream sm:aspect-auto sm:min-h-full">
                      {showPhoto && item.image ? <Image src={item.image} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 152px" /> : <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-forest">{initial(item.displayName)}</span>}
                    </div>
                    <div className="flex min-w-0 flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{item.level} · {item.location || 'Location not set'}</p>
                          <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink">
                            {item.publicProfile ? <Link href={`/sponsor/${item.id}`} className="hover:text-forest">{item.displayName}</Link> : item.displayName}
                          </h3>
                          <p className="mt-1 text-xs text-sage">{[item.school, item.owned ? 'Created by you' : null, item.publicProfile ? 'Public' : 'Private'].filter(Boolean).join(' · ')}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold capitalize text-forest">{item.status}</span>
                      </div>
                      <div>
                        <CampaignProgress raised={item.raised} target={item.target} />
                        <p className="mt-2 text-xs text-sage">{formatUGX(item.raised)} of {formatUGX(item.target)} · {percent}%</p>
                      </div>
                      {item.needs ? <p className="text-sm leading-6 text-sage">{item.needs}</p> : null}
                      {!open && item.note ? <p className="text-sm leading-6 text-ink">{item.note}</p> : null}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <Link href={`/donate?child=${item.id}`} className="inline-flex h-9 items-center justify-center rounded-full bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-deep">Give</Link>
                        <button type="button" className="text-xs font-semibold text-forest" aria-expanded={open} onClick={() => { setOpenId(open ? null : item.id); setConfirming(null) }}>{open ? 'Close' : 'Note'}</button>
                        {item.owned ? <button type="button" className="text-xs font-semibold text-forest" onClick={() => { setEditing(item.id); setCreating(false); fill(item) }}>Edit</button> : null}
                        {confirming === item.id ? (
                          <span className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="text-sage">{item.owned ? 'Delete this learner?' : 'Remove from your account?'}</span>
                            <button type="button" className="font-semibold text-ink disabled:opacity-50" disabled={busy} onClick={() => void run(item.id, () => item.owned ? deleteDonorLearner(item.id) : hideSponsorship(item.id), item.owned ? 'Learner deleted.' : 'Learner removed.')}>{item.owned ? 'Delete' : 'Remove'}</button>
                            <button type="button" className="font-semibold text-forest" onClick={() => setConfirming(null)}>Keep</button>
                          </span>
                        ) : (
                          <button type="button" className="text-xs font-semibold text-ink" onClick={() => { setConfirming(item.id); setOpenId(null) }}>{item.owned ? 'Delete' : 'Remove'}</button>
                        )}
                      </div>
                    </div>
                  </div>
                  {open ? (
                    <div className="border-t border-line bg-cream px-4 py-4 sm:px-5">
                      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-sage">Private note
                        <Input className="mt-2 bg-white" aria-label={`Note for ${item.displayName}`} value={note} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Only you can see this" />
                      </label>
                      <button type="button" className="mt-4 text-sm font-semibold text-forest disabled:opacity-50" disabled={busy} onClick={() => void run(item.id, () => saveSponsorship(item.id, note), 'Note saved.')}>{busy ? 'Saving…' : 'Save note'}</button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section id="find-learner" className="mt-8" aria-labelledby="find-learner-title">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="find-learner-title" className="text-lg font-semibold tracking-tight text-ink">Find a learner</h2>
            <p className="mt-1 text-sm text-sage">Public profiles you have not added yet.</p>
          </div>
          <p className="shrink-0 text-xs text-sage">{matches.length}</p>
        </div>
        <div className="mt-3 border border-line bg-white">
          <div className="border-b border-line p-3 sm:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sage" />
              <Input aria-label="Search learners" className="bg-cream pl-9" placeholder="Search by name, school or place" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {['', ...levels].map((item) => (
                <button key={item || 'all'} type="button" className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${level === item ? 'bg-brand text-white' : 'bg-cream text-forest'}`} onClick={() => setLevel(item)}>
                  {item || 'All'}
                </button>
              ))}
            </div>
          </div>
          {matches.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm leading-6 text-sage">{available.length === 0 ? 'Every public learner is already on this account.' : 'Nothing matches that search.'}</p>
          ) : (
            <ul className="divide-y divide-line">
              {matches.map((item) => {
                const busy = pendingId === item.id
                return (
                  <li key={item.id}>
                    <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
                      <div className="relative size-14 shrink-0 overflow-hidden bg-cream sm:size-16">
                        {item.publicImage && item.image ? <Image src={item.image} alt="" fill className="object-cover" sizes="64px" /> : <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-forest">{initial(item.displayName)}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{item.displayName}</p>
                        <p className="mt-0.5 truncate text-xs text-sage">{item.level} · {item.school} · {item.location}</p>
                        <p className="mt-1 text-xs text-sage">{formatUGX(item.raised)} of {formatUGX(item.target)}</p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-forest px-3 text-xs font-semibold text-white hover:bg-brand-deep disabled:opacity-50 sm:px-4"
                        aria-label={busy ? `Adding ${item.displayName}` : `Sponsor ${item.displayName}`}
                        disabled={busy}
                        onClick={() => void run(item.id, () => saveSponsorship(item.id, ''), `${item.displayName} added.`)}
                      >
                        <Plus className="size-3.5" />
                        <span className="hidden min-[380px]:inline">{busy ? 'Adding' : 'Sponsor'}</span>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-3 border border-line px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-sage">{hint}</span>
      </span>
      <input className="mt-1 size-4 accent-forest" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '•'
}
