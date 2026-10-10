'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { createDonorUpdate, deleteDonorUpdate, updateDonorUpdate } from '@/lib/donor-actions'
import { formatDate } from '@/lib/format'
import type { DonorUpdate } from '@/lib/donor'
import type { Story } from '@/lib/types'

export function UpdateBoard({ notes, stories }: { notes: DonorUpdate[]; stories: Story[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [drafts, setDrafts] = useState<Record<string, { title: string; body: string }>>({})
  const [error, setError] = useState('')

  async function run(work: () => Promise<void>) {
    setError('')
    try {
      await work()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The note could not be saved.')
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    await run(async () => {
      await createDonorUpdate({ title, body })
      setTitle('')
      setBody('')
    })
  }

  return (
    <div>
      <form onSubmit={onCreate} className="bg-mist p-5">
        <h2 className="text-sm font-semibold text-ink">Write an update</h2>
        <div className="mt-4 grid gap-3">
          <Label>Title<Input className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} required /></Label>
          <Label>Note<Textarea className="mt-2" value={body} onChange={(event) => setBody(event.target.value)} required /></Label>
        </div>
        {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
        <Button className="mt-4 rounded-full bg-forest text-white hover:bg-brand-deep">Save update</Button>
      </form>
      <ul className="mt-6 grid gap-4">
        {notes.map((item) => {
          const draft = drafts[item.id] ?? { title: item.title, body: item.body }
          return (
            <li key={item.id} className="bg-mist p-5">
              <p className="text-xs text-sage">{formatDate(item.date)}</p>
              <Input className="mt-3" aria-label="Title" value={draft.title} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, title: event.target.value } }))} />
              <Textarea className="mt-3" aria-label="Note" value={draft.body} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, body: event.target.value } }))} />
              <div className="mt-3 flex gap-3">
                <button type="button" className="text-xs font-semibold text-forest" onClick={() => void run(() => updateDonorUpdate(item.id, draft))}>Save</button>
                <button type="button" className="text-xs font-semibold text-ink" onClick={() => void run(() => deleteDonorUpdate(item.id))}>Remove</button>
              </div>
            </li>
          )
        })}
      </ul>
      {stories.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Stories from your causes</h2>
          <ul className="mt-4 grid gap-4">
            {stories.map((story) => (
              <li key={story.id} className="overflow-hidden bg-mist">
                <div className="grid sm:grid-cols-[12rem_1fr]">
                  <div className="relative min-h-36 bg-mist">
                    <Image src={story.image} alt="" fill className="object-cover" sizes="192px" />
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
