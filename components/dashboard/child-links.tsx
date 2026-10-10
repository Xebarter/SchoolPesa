'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StatusPill } from '@/components/admin/ui'
import { CampaignProgress } from '@/components/campaign-progress'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { hideSponsorship, saveSponsorship } from '@/lib/donor-actions'
import { formatUGX, percentOf } from '@/lib/format'
import type { Beneficiary } from '@/lib/types'

export function ChildLinks({ saved, choices }: { saved: (Beneficiary & { note: string })[]; choices: Pick<Beneficiary, 'id' | 'displayName'>[] }) {
  const router = useRouter()
  const [beneficiaryId, setBeneficiaryId] = useState(choices[0]?.id ?? '')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  async function run(work: () => Promise<void>) {
    setError('')
    try {
      await work()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The sponsorship list could not be updated.')
    }
  }

  return (
    <div>
      <form className="flex flex-col gap-3 bg-mist p-4 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); void run(() => saveSponsorship(beneficiaryId, '')) }}>
        <label className="min-w-0 flex-1 text-sm font-medium text-ink">Sponsor a learner
          <Select className="mt-2" value={beneficiaryId} onChange={(event) => setBeneficiaryId(event.target.value)} aria-label="Learner to sponsor">
            {choices.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}
          </Select>
        </label>
        <Button className="rounded-full bg-forest text-white hover:bg-brand-deep" disabled={!beneficiaryId}>Add</Button>
      </form>
      {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
      <ul className="mt-6 grid gap-4 lg:grid-cols-3">
        {saved.map((item) => {
          const percent = percentOf(item.raised, item.target)
          return (
            <li key={item.id} className="flex flex-col overflow-hidden bg-mist">
              <div className="relative aspect-[1.5] bg-mist">
                {item.publicImage ? <Image src={item.image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" /> : null}
                <div className="absolute left-3 top-3"><StatusPill value={item.status} /></div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{item.level}</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
                    <Link href={`/sponsor/${item.id}`} className="hover:text-forest">{item.displayName}</Link>
                  </h2>
                  <p className="mt-1 text-xs text-sage">{item.school} · {item.location}</p>
                </div>
                <CampaignProgress raised={item.raised} target={item.target} />
                <p className="text-xs text-sage">{formatUGX(item.raised)} · {percent}%</p>
                <Input aria-label={`Note for ${item.displayName}`} value={notes[item.id] ?? item.note} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Your note" />
                <div className="flex gap-3">
                  <button type="button" className="text-xs font-semibold text-forest" onClick={() => void run(() => saveSponsorship(item.id, notes[item.id] ?? item.note))}>Save</button>
                  <button type="button" className="text-xs font-semibold text-ink" onClick={() => void run(() => hideSponsorship(item.id))}>Remove</button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
