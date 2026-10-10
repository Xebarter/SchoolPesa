'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { CampaignProgress } from '@/components/campaign-progress'
import { Input } from '@/components/ui/input'
import { hideCampaignLink, saveCampaignLink } from '@/lib/donor-actions'
import { formatUGX, percentOf } from '@/lib/format'
import type { Campaign } from '@/lib/types'

export function CampaignLinks({ saved, campaigns }: { saved: (Campaign & { note: string })[]; campaigns: Campaign[] }) {
  const router = useRouter()
  const [openId, setOpenId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const followed = new Set(saved.map((item) => item.id))
  const available = campaigns.filter((item) => !followed.has(item.id))
  const active = saved.filter((item) => item.status === 'active').length
  const raised = saved.reduce((sum, item) => sum + item.raised, 0)
  const figures = [
    [String(saved.length), 'Followed'],
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The campaign list could not be updated.')
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
        <Link href="/campaigns" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep sm:w-fit">
          Browse <ArrowRight className="size-4" />
        </Link>
      </div>

      <section className="mt-6 grid grid-cols-3 overflow-hidden border border-line bg-white" aria-label="Campaign summary">
        {figures.map(([value, label]) => (
          <div key={label} className="min-w-0 border-r border-line p-3 last:border-r-0 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sage sm:text-[11px] sm:tracking-[0.16em]">{label}</p>
            <p className="mt-2 truncate text-lg font-semibold tracking-[-.04em] text-ink sm:mt-3 sm:text-3xl">{value}</p>
          </div>
        ))}
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
        {saved.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-5 sm:py-14">
            <p className="text-lg font-semibold tracking-tight text-ink">No campaigns on this account yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-sage">Choose one above to keep its progress, and your own note, in one place.</p>
          </div>
        ) : (
          <ul>
            {saved.map((item) => {
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
