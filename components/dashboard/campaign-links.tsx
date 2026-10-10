'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { CampaignProgress } from '@/components/campaign-progress'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { createDonorCampaign, deleteDonorCampaign, hideCampaignLink, saveCampaignLink, updateDonorCampaign, type DonorCampaignInput } from '@/lib/donor-actions'
import { formatUGX, percentOf } from '@/lib/format'
import type { Campaign, CampaignStatus, EducationLevel } from '@/lib/types'

const levels: EducationLevel[] = ['Nursery', 'Primary', 'Secondary', 'University']
const statuses: CampaignStatus[] = ['draft', 'active', 'paused', 'completed', 'archived']

const blank: DonorCampaignInput = {
  title: '',
  summary: '',
  category: 'School Fees',
  level: 'Primary',
  location: '',
  target: 0,
  deadline: '',
  status: 'active',
}

export function CampaignLinks({ saved, campaigns, owned }: { saved: (Campaign & { note: string })[]; campaigns: Campaign[]; owned: Campaign[] }) {
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

  const ownedIds = new Set(owned.map((item) => item.id))
  const following = saved.filter((item) => !ownedIds.has(item.id))
  const followed = new Set([...saved.map((item) => item.id), ...ownedIds])
  const available = campaigns.filter((item) => !followed.has(item.id))

  useEffect(() => {
    if (creating || editing) document.getElementById('campaign-form')?.scrollIntoView({ block: 'start' })
  }, [creating, editing])
  const listed = [...owned, ...following]
  const active = listed.filter((item) => item.status === 'active').length
  const raised = listed.reduce((sum, item) => sum + item.raised, 0)
  const figures = [
    [String(listed.length), 'Followed'],
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
      router.refresh()
      return true
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The campaign list could not be updated.')
      return false
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-line pb-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Your causes</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-ink sm:text-5xl">Campaigns</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-sage">Causes you follow, with a private note and a way back to give.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="inline-flex h-11 w-full items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-semibold text-forest hover:border-forest sm:w-fit" onClick={() => { setCreating((value) => !value); setEditing(null); setForm(blank) }}>
            {creating ? 'Close' : 'New campaign'}
          </button>
          <Link href="/campaigns" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep sm:w-fit">
            Browse <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-3 overflow-hidden border border-line bg-white" aria-label="Campaign summary">
        {figures.map(([value, label]) => (
          <div key={label} className="min-w-0 border-r border-line p-3 last:border-r-0 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sage sm:text-[11px] sm:tracking-[0.16em]">{label}</p>
            <p className="mt-2 truncate text-lg font-semibold tracking-[-.04em] text-ink sm:mt-3 sm:text-3xl">{value}</p>
          </div>
        ))}
      </section>

      {(creating || editing) ? (
        <form
          id="campaign-form"
          className="mt-6 grid gap-4 border border-line bg-white p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault()
            const payload = { ...form, target: Number(form.target) || 0 }
            void run(editing ?? 'new', () => editing ? updateDonorCampaign(editing, payload) : createDonorCampaign(payload), editing ? 'Campaign updated.' : 'Campaign created.').then((saved) => {
              if (!saved) return
              setCreating(false)
              setEditing(null)
              setForm(blank)
            })
          }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-ink">{editing ? 'Edit campaign' : 'New campaign'}</h2>
          <Label>Title<Input className="mt-2" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Label>
          <Label>Summary<Textarea className="mt-2" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label>Category<Input className="mt-2" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Label>
            <Label>Location<Input className="mt-2" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></Label>
            <Label>Education level
              <Select className="mt-2" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>
                {levels.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>Status
              <Select className="mt-2" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {statuses.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>Target (UGX)<Input className="mt-2" inputMode="numeric" value={form.target ? String(form.target) : ''} onChange={(event) => setForm({ ...form, target: Number(event.target.value.replace(/[^\d]/g, '')) || 0 })} /></Label>
            <Label>Deadline<Input className="mt-2" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></Label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-50" disabled={pendingId === (editing ?? 'new')}>
              {pendingId === (editing ?? 'new') ? 'Saving…' : editing ? 'Save changes' : 'Create campaign'}
            </button>
            <button type="button" className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-forest" onClick={() => { setCreating(false); setEditing(null); setForm(blank) }}>Cancel</button>
          </div>
        </form>
      ) : null}

      <section className="mt-8 border border-line bg-white" aria-labelledby="owned-campaigns-title">
        <h2 id="owned-campaigns-title" className="border-b border-line px-4 py-4 text-lg font-semibold tracking-tight text-ink sm:px-5">Created by you</h2>
        {owned.length === 0 ? (
          <p className="px-4 py-8 text-sm leading-6 text-sage sm:px-5">Campaigns you create are stored on your account and can be edited or removed.</p>
        ) : (
          <ul>
            {owned.map((item) => {
              const busy = pendingId === item.id
              const removing = confirming === item.id
              return (
                <li key={item.id} className="border-b border-line last:border-b-0">
                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{item.status} · {item.level}</p>
                      <h3 className="mt-1 truncate text-base font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1 truncate text-xs text-sage">{item.location || 'Location not set'} · {formatUGX(item.target)} target</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <button type="button" className="text-sm font-semibold text-forest" onClick={() => { setEditing(item.id); setCreating(false); setForm({ title: item.title, summary: item.summary, category: item.category, level: item.level, location: item.location, target: item.target, deadline: item.deadline, status: item.status }) }}>Edit</button>
                      {removing ? (
                        <span className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="text-sage">Delete this campaign?</span>
                          <button type="button" className="font-semibold text-ink disabled:opacity-50" disabled={busy} onClick={() => void run(item.id, () => deleteDonorCampaign(item.id), 'Campaign deleted.')}>Delete</button>
                          <button type="button" className="font-semibold text-forest" onClick={() => setConfirming(null)}>Keep</button>
                        </span>
                      ) : (
                        <button type="button" className="text-sm font-semibold text-ink" onClick={() => setConfirming(item.id)}>Delete</button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section id="available-campaigns" className="mt-8" aria-labelledby="available-campaigns-title">
        <div className="flex items-end justify-between gap-3">
          <h2 id="available-campaigns-title" className="text-lg font-semibold tracking-tight text-ink">Available to follow</h2>
          <p className="shrink-0 text-xs text-sage">{available.length}</p>
        </div>
        {available.length === 0 ? (
          <p className="mt-3 border border-line bg-white px-4 py-8 text-center text-sm leading-6 text-sage">Every campaign is already on this account.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border border-line bg-white">
            {available.map((item) => {
              const busy = pendingId === item.id
              return (
                <li key={item.id}>
                  <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
                    <div className="relative size-14 shrink-0 overflow-hidden bg-cream sm:size-16">
                      <Image src={item.image} alt="" fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-sage">{item.category} · {item.location}</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-forest px-3 text-xs font-semibold text-white hover:bg-brand-deep disabled:opacity-50 sm:px-4"
                      aria-label={busy ? `Adding ${item.title}` : `Follow ${item.title}`}
                      disabled={busy}
                      onClick={() => void run(item.id, () => saveCampaignLink(item.id, ''), 'Campaign added.')}
                    >
                      <Plus className="size-3.5" />
                      <span className="hidden min-[380px]:inline">{busy ? 'Adding' : 'Follow'}</span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="mt-8 border border-line bg-white" aria-labelledby="followed-campaigns-title">
        <h2 id="followed-campaigns-title" className="border-b border-line px-4 py-4 text-lg font-semibold tracking-tight text-ink sm:px-5">Following</h2>
        {notice ? <p className="border-b border-line px-4 py-3 text-sm font-medium text-forest sm:px-5" role="status">{notice}</p> : null}
        {error ? <p className="border-b border-line px-4 py-3 text-sm text-destructive sm:px-5" role="alert">{error}</p> : null}
        {following.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-5 sm:py-14">
            <p className="text-lg font-semibold tracking-tight text-ink">No campaigns on this account yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-sage">Choose one above to keep its progress, and your own note, in one place.</p>
          </div>
        ) : (
          <ul>
            {following.map((item) => {
              const percent = percentOf(item.raised, item.target)
              const open = openId === item.id
              const busy = pendingId === item.id
              const note = notes[item.id] ?? item.note
              return (
                <li key={item.id} className="border-b border-line last:border-b-0">
                  <div className="sm:grid sm:grid-cols-[9.5rem_1fr]">
                    <div className="relative aspect-[16/9] bg-cream sm:aspect-auto sm:min-h-40">
                      <Image src={item.image} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 152px" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{item.category} · {item.location}</p>
                          <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink">
                            <Link href={`/campaigns/${item.slug}`} className="hover:text-forest">{item.title}</Link>
                          </h3>
                        </div>
                        <StatusPill value={item.status} />
                      </div>
                      <div>
                        <CampaignProgress raised={item.raised} target={item.target} />
                        <p className="mt-2 text-xs text-sage">{formatUGX(item.raised)} of {formatUGX(item.target)} · {percent}%</p>
                      </div>
                      {item.note ? <p className="text-sm leading-6 text-sage">{item.note}</p> : null}
                      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center">
                        <Link href={`/donate?campaign=${item.slug}`} className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-deep min-[420px]:h-9 min-[420px]:text-xs">Give</Link>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <button type="button" className="text-sm font-semibold text-forest min-[420px]:text-xs" aria-expanded={open} onClick={() => { setOpenId(open ? null : item.id); setConfirming(null) }}>
                            {open ? 'Close' : 'Note'}
                          </button>
                          {confirming === item.id ? (
                            <span className="flex flex-wrap items-center gap-3 text-sm min-[420px]:text-xs">
                              <span className="text-sage">Remove this campaign?</span>
                              <button type="button" className="font-semibold text-ink disabled:opacity-50" disabled={busy} onClick={() => void run(item.id, () => hideCampaignLink(item.id), 'Campaign removed.')}>Remove</button>
                              <button type="button" className="font-semibold text-forest" onClick={() => setConfirming(null)}>Keep</button>
                            </span>
                          ) : (
                            <button type="button" className="text-sm font-semibold text-ink min-[420px]:text-xs" onClick={() => { setConfirming(item.id); setOpenId(null) }}>Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {open ? (
                    <div className="border-t border-line bg-cream px-4 py-4 sm:px-5">
                      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-sage">Private note
                        <Input className="mt-2 bg-white" aria-label={`Note for ${item.title}`} value={note} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} />
                      </label>
                      <button type="button" className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-forest disabled:opacity-50" disabled={busy} onClick={() => void run(item.id, () => saveCampaignLink(item.id, note), 'Note saved.')}>
                        {busy ? 'Saving…' : 'Save note'}
                      </button>
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
