'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Metric, PageIntro, StatusPill } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { declineImpactUpdate, publishImpactUpdate, requestImpactChanges, saveImpactUpdate, unpublishImpactUpdate } from '@/lib/admin-actions'
import type { DonorUpdate, UpdateStatus } from '@/lib/donor'
import { formatDate } from '@/lib/format'

const categories = ['Success Stories', 'Scholarships', 'School Requirements', 'Community', 'Students', 'Events']

const statusLabel: Record<UpdateStatus, string> = {
  draft: 'Draft',
  submitted: 'In review',
  changes: 'Needs changes',
  published: 'Published',
  declined: 'Declined',
}

const filters: { id: 'queue' | UpdateStatus; label: string }[] = [
  { id: 'queue', label: 'To review' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'changes', label: 'Sent back' },
  { id: 'published', label: 'Published' },
  { id: 'declined', label: 'Declined' },
  { id: 'draft', label: 'Donor drafts' },
]

type Option = { id: string; label: string }

export function ImpactReview({ updates, campaigns, learners }: { updates: DonorUpdate[]; campaigns: Option[]; learners: Option[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('queue')
  const [openId, setOpenId] = useState<string | null>(updates.find((item) => item.status === 'submitted')?.id ?? updates[0]?.id ?? null)
  const [drafts, setDrafts] = useState<Record<string, { title: string; body: string; category: string; campaignId: string; beneficiaryId: string; note: string }>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  const counts = useMemo(() => {
    const tally = { submitted: 0, changes: 0, published: 0, declined: 0, draft: 0 }
    for (const item of updates) tally[item.status] += 1
    return tally
  }, [updates])

  const visible = updates.filter((item) => filter === 'queue' ? item.status === 'submitted' || item.status === 'changes' : item.status === filter)

  function draftFor(item: DonorUpdate) {
    return drafts[item.id] ?? {
      title: item.title,
      body: item.body,
      category: item.category,
      campaignId: item.campaignId ?? '',
      beneficiaryId: item.beneficiaryId ?? '',
      note: item.reviewNote,
    }
  }

  function patch(item: DonorUpdate, next: Partial<ReturnType<typeof draftFor>>) {
    setDrafts((current) => ({ ...current, [item.id]: { ...draftFor(item), ...next } }))
  }

  async function run(work: () => Promise<void>, message: string) {
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      await work()
      setNotice(message)
      setDrafts({})
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The update could not be saved.')
    } finally {
      setPending(false)
    }
  }

  function payload(item: DonorUpdate) {
    const draft = draftFor(item)
    return { title: draft.title, body: draft.body, category: draft.category, campaignId: draft.campaignId, beneficiaryId: draft.beneficiaryId }
  }

  return (
    <div>
      <PageIntro title="Impact updates" description="Review notes donors submit, edit the wording, send them back, or publish them as stories." />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Waiting" value={String(counts.submitted)} hint="Submitted and not yet decided" />
        <Metric label="Sent back" value={String(counts.changes)} hint="Waiting on the donor" />
        <Metric label="Published" value={String(counts.published)} hint="Live on the public site" />
        <Metric label="Declined" value={String(counts.declined)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item.id ? 'bg-forest text-white' : 'bg-mist text-ink'}`}>
            {item.label}{item.id === 'queue' ? '' : ` ${counts[item.id]}`}
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-forest" role="status">{notice}</p> : null}

      {visible.length === 0 ? (
        <p className="mt-6 bg-mist px-5 py-8 text-sm text-sage">Nothing in this queue.</p>
      ) : (
        <ul className="mt-4 grid gap-4">
          {visible.map((item) => {
            const open = openId === item.id
            const draft = draftFor(item)
            const donorDraft = item.status === 'draft'
            return (
              <li key={item.id} className="bg-mist">
                <button type="button" className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left" onClick={() => setOpenId(open ? null : item.id)} aria-expanded={open}>
                  <span>
                    <span className="flex flex-wrap items-center gap-2">
                      <StatusPill value={item.status} label={statusLabel[item.status]} />
                      <span className="text-xs text-sage">{formatDate(item.date)} · {item.email}</span>
                    </span>
                    <span className="mt-2 block text-base font-semibold text-ink">{item.title}</span>
                  </span>
                  <span className="text-xs font-semibold text-forest">{open ? 'Close' : 'Review'}</span>
                </button>
                {open ? (
                  <div className="grid gap-4 border-t border-line px-5 py-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Label>Title<Input className="mt-2" value={draft.title} onChange={(event) => patch(item, { title: event.target.value })} /></Label>
                      <Label>Category
                        <Select className="mt-2" value={draft.category} onChange={(event) => patch(item, { category: event.target.value })}>
                          {categories.map((category) => <option key={category}>{category}</option>)}
                        </Select>
                      </Label>
                      <Label>Campaign
                        <Select className="mt-2" value={draft.campaignId} onChange={(event) => patch(item, { campaignId: event.target.value })}>
                          <option value="">None</option>
                          {campaigns.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </Select>
                      </Label>
                      <Label>Learner
                        <Select className="mt-2" value={draft.beneficiaryId} onChange={(event) => patch(item, { beneficiaryId: event.target.value })}>
                          <option value="">None</option>
                          {learners.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </Select>
                      </Label>
                    </div>
                    <Label>Note<Textarea className="mt-2 min-h-40" value={draft.body} onChange={(event) => patch(item, { body: event.target.value })} /></Label>
                    <Label>Note to the donor
                      <Textarea className="mt-2 min-h-20" value={draft.note} onChange={(event) => patch(item, { note: event.target.value })} placeholder="What should they change, or why this will not be published?" />
                    </Label>
                    {item.storySlug ? <Link href={`/stories/${item.storySlug}`} className="text-xs font-semibold text-forest">Open the public story</Link> : null}
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" className="rounded-full" disabled={pending} onClick={() => void run(() => saveImpactUpdate(item.id, payload(item)), 'Edits saved.')}>Save edits</Button>
                      <Button type="button" className="rounded-full bg-forest text-white hover:bg-brand-deep" disabled={pending || donorDraft} onClick={() => void run(() => publishImpactUpdate(item.id, payload(item)), 'Published as a story.')}>Publish</Button>
                      <Button type="button" variant="outline" className="rounded-full" disabled={pending || donorDraft} onClick={() => void run(() => requestImpactChanges(item.id, draft.note), 'Sent back to the donor.')}>Request changes</Button>
                      <Button type="button" variant="outline" className="rounded-full" disabled={pending || donorDraft} onClick={() => void run(() => declineImpactUpdate(item.id, draft.note), 'Update declined.')}>Decline</Button>
                      {item.status === 'published' ? (
                        <Button type="button" variant="outline" className="rounded-full" disabled={pending} onClick={() => void run(() => unpublishImpactUpdate(item.id), 'Taken off the site and returned to review.')}>Unpublish</Button>
                      ) : null}
                    </div>
                    {donorDraft ? <p className="text-xs text-sage">This is still a donor draft. Publishing waits until they send it.</p> : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-8 max-w-2xl text-sm leading-6 text-sage">Donors keep drafts on their account. A submission lands here. Publishing creates or updates a public story and tells the donor. Requesting changes or declining includes the note you write.</p>
    </div>
  )
}
