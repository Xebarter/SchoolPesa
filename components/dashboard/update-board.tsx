'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { createDonorUpdate, deleteDonorUpdate, submitDonorUpdate, updateDonorUpdate, withdrawDonorUpdate } from '@/lib/donor-actions'
import type { DonorUpdate, UpdateStatus } from '@/lib/donor'
import { formatDate } from '@/lib/format'
import type { Story } from '@/lib/types'

export type CauseOption = { id: string; kind: 'campaign' | 'learner'; label: string }

const filters: { id: 'all' | UpdateStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'submitted', label: 'In review' },
  { id: 'changes', label: 'Needs changes' },
  { id: 'published', label: 'Published' },
  { id: 'declined', label: 'Declined' },
]

const statusLabel: Record<UpdateStatus, string> = {
  draft: 'Draft',
  submitted: 'In review',
  changes: 'Needs changes',
  published: 'Published',
  declined: 'Declined',
}

const statusCopy: Record<UpdateStatus, string> = {
  draft: 'Only you can see this. Send it when you are ready for an admin to review it.',
  submitted: 'An administrator is reviewing this. Withdraw it if you need to change the wording.',
  changes: 'An administrator sent this back. Update the note, then send it again.',
  published: 'This is live as a public story. Ask an admin if it needs to come down.',
  declined: 'This was not published. You can revise it and send it again.',
}

function causeValue(item: { campaignId?: string; beneficiaryId?: string }) {
  if (item.campaignId) return `campaign:${item.campaignId}`
  if (item.beneficiaryId) return `learner:${item.beneficiaryId}`
  return ''
}

function splitCause(value: string) {
  if (value.startsWith('campaign:')) return { campaignId: value.slice(9), beneficiaryId: '' }
  if (value.startsWith('learner:')) return { campaignId: '', beneficiaryId: value.slice(8) }
  return { campaignId: '', beneficiaryId: '' }
}

export function UpdateBoard({ notes, stories, causes }: { notes: DonorUpdate[]; stories: Story[]; causes: CauseOption[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [cause, setCause] = useState('')
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { title: string; body: string; cause: string }>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  const counts = useMemo(() => {
    const tally = { all: notes.length, draft: 0, submitted: 0, changes: 0, published: 0, declined: 0 }
    for (const item of notes) tally[item.status] += 1
    return tally
  }, [notes])

  const visible = notes.filter((item) => filter === 'all' || item.status === filter)
  const campaigns = causes.filter((item) => item.kind === 'campaign')
  const learners = causes.filter((item) => item.kind === 'learner')

  function causeLabel(item: DonorUpdate) {
    const match = causes.find((option) => (item.campaignId && option.kind === 'campaign' && option.id === item.campaignId) || (item.beneficiaryId && option.kind === 'learner' && option.id === item.beneficiaryId))
    return match?.label
  }

  async function run(work: () => Promise<void>, message: string) {
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      await work()
      setNotice(message)
      setEditing(null)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The update could not be saved.')
    } finally {
      setPending(false)
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    const links = splitCause(cause)
    await run(async () => {
      await createDonorUpdate({ title, body, ...links })
      setTitle('')
      setBody('')
      setCause('')
    }, 'Draft saved. Send it for review when it is ready.')
  }

  function CauseSelect({ value, onChange, id }: { value: string; onChange: (value: string) => void; id: string }) {
    return (
      <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">General note</option>
        {campaigns.length > 0 ? (
          <optgroup label="Campaigns">
            {campaigns.map((item) => <option key={item.id} value={`campaign:${item.id}`}>{item.label}</option>)}
          </optgroup>
        ) : null}
        {learners.length > 0 ? (
          <optgroup label="Learners">
            {learners.map((item) => <option key={item.id} value={`learner:${item.id}`}>{item.label}</option>)}
          </optgroup>
        ) : null}
      </Select>
    )
  }

  return (
    <div>
      <form onSubmit={onCreate} className="bg-mist p-5">
        <h2 className="text-sm font-semibold text-ink">Write an update</h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-sage">Save a draft about a gift, a learner, or a visit. An administrator reviews it, can edit the wording, and publishes it as a public story.</p>
        <div className="mt-4 grid gap-3">
          <Label htmlFor="update-title">Title<Input id="update-title" className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} required /></Label>
          <Label htmlFor="update-cause">Related to
            <div className="mt-2"><CauseSelect id="update-cause" value={cause} onChange={setCause} /></div>
          </Label>
          <Label htmlFor="update-body">What happened<Textarea id="update-body" className="mt-2 min-h-36" value={body} onChange={(event) => setBody(event.target.value)} required placeholder="Fees posted, books delivered, a term that started…" /></Label>
        </div>
        <Button className="mt-4 rounded-full bg-forest text-white hover:bg-brand-deep" disabled={pending}>Save draft</Button>
      </form>

      {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-forest" role="status">{notice}</p> : null}

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter updates">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item.id ? 'bg-forest text-white' : 'bg-mist text-ink'}`}
          >
            {item.label} {counts[item.id]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 bg-mist px-5 py-8 text-sm text-sage">{notes.length === 0 ? 'You have not written an update yet.' : 'Nothing in this list.'}</p>
      ) : (
        <ul className="mt-4 grid gap-4">
          {visible.map((item) => {
            const draft = drafts[item.id] ?? { title: item.title, body: item.body, cause: causeValue(item) }
            const open = editing === item.id
            const locked = item.status === 'submitted' || item.status === 'published'
            const related = causeLabel(item)
            return (
              <li key={item.id} className="bg-mist p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill value={item.status} label={statusLabel[item.status]} />
                      <p className="text-xs text-sage">{formatDate(item.date)}</p>
                    </div>
                    {!open ? <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">{item.title}</h3> : null}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-sage">{statusCopy[item.status]}</p>
                {related && !open ? <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand">{related}</p> : null}
                {(item.status === 'changes' || item.status === 'declined') && item.reviewNote ? (
                  <p className="mt-3 bg-white px-3 py-2 text-sm leading-6 text-ink"><span className="font-semibold">From the admin. </span>{item.reviewNote}</p>
                ) : null}
                {open ? (
                  <div className="mt-4 grid gap-3">
                    <Label>Title<Input className="mt-2" value={draft.title} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, title: event.target.value } }))} maxLength={140} /></Label>
                    <Label>Related to
                      <div className="mt-2"><CauseSelect id={`cause-${item.id}`} value={draft.cause} onChange={(value) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, cause: value } }))} /></div>
                    </Label>
                    <Label>Note<Textarea className="mt-2" value={draft.body} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, body: event.target.value } }))} /></Label>
                  </div>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{item.body}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {open ? (
                    <>
                      <Button type="button" className="rounded-full bg-forest text-white hover:bg-brand-deep" disabled={pending} onClick={() => void run(() => updateDonorUpdate(item.id, { title: draft.title, body: draft.body, ...splitCause(draft.cause) }), 'Draft updated.')}>Save</Button>
                      <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditing(null)}>Cancel</Button>
                    </>
                  ) : null}
                  {!open && !locked ? (
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => { setEditing(item.id); setDrafts((current) => ({ ...current, [item.id]: { title: item.title, body: item.body, cause: causeValue(item) } })) }}>Edit</Button>
                  ) : null}
                  {!locked ? (
                    <Button type="button" className="rounded-full bg-forest text-white hover:bg-brand-deep" disabled={pending} onClick={() => void run(async () => {
                      if (open) await updateDonorUpdate(item.id, { title: draft.title, body: draft.body, ...splitCause(draft.cause) })
                      await submitDonorUpdate(item.id)
                    }, 'Sent for review.')}>Send for review</Button>
                  ) : null}
                  {item.status === 'submitted' ? (
                    <Button type="button" variant="outline" className="rounded-full" disabled={pending} onClick={() => void run(() => withdrawDonorUpdate(item.id), 'Withdrawn. You can edit it again.')}>Withdraw</Button>
                  ) : null}
                  {item.status === 'published' && item.storySlug ? (
                    <Link href={`/stories/${item.storySlug}`} className="inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold text-forest">View story <ArrowUpRight className="ml-1 size-3.5" /></Link>
                  ) : null}
                  {!locked ? (
                    <button type="button" className="rounded-full px-3 text-xs font-semibold text-ink" disabled={pending} onClick={() => void run(() => deleteDonorUpdate(item.id), 'Update removed.')}>Remove</button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {stories.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Stories from your causes</h2>
          <p className="mt-1 text-sm text-sage">Published stories tied to campaigns and learners on your account, including ones the team wrote.</p>
          <ul className="mt-4 grid gap-4">
            {stories.map((story) => (
              <li key={story.id} className="overflow-hidden bg-mist">
                <div className="grid sm:grid-cols-[12rem_1fr]">
                  <div className="relative min-h-36 bg-mist">
                    {story.image ? <Image src={story.image} alt="" fill className="object-cover" sizes="192px" /> : null}
                  </div>
                  <div className="flex flex-col justify-center p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{story.category}</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink">{story.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-sage">{story.excerpt}</p>
                    <Link href={`/stories/${story.slug}`} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-forest">Read story <ArrowUpRight className="size-3.5" /></Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
