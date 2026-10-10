'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PageIntro, Panel, StatusPill } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { deletePartner, deleteVolunteer, savePartner, saveVolunteer } from '@/lib/admin-actions'
import type { Donation, Partner, Volunteer } from '@/lib/types'

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function PeopleBoard({ donors, partners, volunteers }: { donors: Donation[]; partners: Partner[]; volunteers: Volunteer[] }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [partnerId, setPartnerId] = useState<string | undefined>()
  const [volunteerId, setVolunteerId] = useState<string | undefined>()

  async function onPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setError('')
    try {
      await savePartner({ id: partnerId, name: String(data.get('name') || ''), logoUrl: String(data.get('logo') || '') })
      setPartnerId(undefined)
      event.currentTarget.reset()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The partner could not be saved.')
    }
  }

  async function onVolunteer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setError('')
    try {
      await saveVolunteer({
        id: volunteerId,
        name: String(data.get('name') || ''),
        email: String(data.get('email') || ''),
        phone: String(data.get('phone') || ''),
        skills: String(data.get('skills') || ''),
        interest: String(data.get('interest') || ''),
        availability: String(data.get('availability') || ''),
        message: String(data.get('message') || ''),
        status: String(data.get('status') || 'new') as Volunteer['status'],
      })
      setVolunteerId(undefined)
      event.currentTarget.reset()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The volunteer could not be saved.')
    }
  }

  return (
    <div>
      <PageIntro title="People" description="Named donors come from gifts. Add, update and remove partners and volunteers." />
      {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title={partnerId ? 'Edit partner' : 'Add a partner'} padded>
          <form key={partnerId ?? 'new-partner'} className="grid gap-3" onSubmit={onPartner}>
            <Label>Name<Input className="mt-2" name="name" required defaultValue={partners.find((item) => item.id === partnerId)?.name} /></Label>
            <Label>Logo URL<Input className="mt-2" name="logo" defaultValue={partners.find((item) => item.id === partnerId)?.logoUrl} /></Label>
            <div className="flex gap-2">
              <Button className="rounded-full bg-forest">{partnerId ? 'Update partner' : 'Save partner'}</Button>
              {partnerId ? <Button type="button" variant="outline" className="rounded-full" onClick={() => setPartnerId(undefined)}>Cancel</Button> : null}
            </div>
          </form>
        </Panel>
        <Panel title={volunteerId ? 'Edit volunteer' : 'Add a volunteer'} padded>
          <form key={volunteerId ?? 'new-volunteer'} className="grid gap-3" onSubmit={onVolunteer}>
            <Label>Name<Input className="mt-2" name="name" required defaultValue={volunteers.find((item) => item.id === volunteerId)?.name} /></Label>
            <Label>Email<Input className="mt-2" name="email" type="email" required defaultValue={volunteers.find((item) => item.id === volunteerId)?.email} /></Label>
            <Label>Phone<Input className="mt-2" name="phone" defaultValue={volunteers.find((item) => item.id === volunteerId)?.phone} /></Label>
            <Label>Interest<Input className="mt-2" name="interest" defaultValue={volunteers.find((item) => item.id === volunteerId)?.interest} /></Label>
            <Label>Availability<Input className="mt-2" name="availability" defaultValue={volunteers.find((item) => item.id === volunteerId)?.availability} /></Label>
            <Label>Skills<Input className="mt-2" name="skills" defaultValue={volunteers.find((item) => item.id === volunteerId)?.skills} /></Label>
            <Label>Status
              <Select className="mt-2" name="status" defaultValue={volunteers.find((item) => item.id === volunteerId)?.status ?? 'new'}>
                {['new', 'reviewing', 'accepted'].map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>Message<Textarea className="mt-2" name="message" defaultValue={volunteers.find((item) => item.id === volunteerId)?.message} /></Label>
            <div className="flex gap-2">
              <Button className="rounded-full bg-forest">{volunteerId ? 'Update volunteer' : 'Save volunteer'}</Button>
              {volunteerId ? <Button type="button" variant="outline" className="rounded-full" onClick={() => setVolunteerId(undefined)}>Cancel</Button> : null}
            </div>
          </form>
        </Panel>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel title="Donors" description={`${donors.length} named gifts`} className="xl:col-span-2">
          <ul className="divide-y divide-line">
            {donors.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-semibold text-forest">{initials(item.donorName)}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.donorName}</p>
                  <p className="truncate text-xs text-sage">{item.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Partners" description={`${partners.length} organizations`}>
          <ul className="divide-y divide-line">
            {partners.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <p className="text-sm font-semibold text-ink">{item.name}</p>
                <span className="flex gap-2 text-xs font-semibold">
                  <button type="button" className="text-forest" onClick={() => setPartnerId(item.id)}>Edit</button>
                  <button type="button" className="text-ink" onClick={() => void deletePartner(item.id).then(() => router.refresh()).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'The partner could not be removed.'))}>Remove</button>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Volunteers" description="Applications on record" className="xl:col-span-3">
          <ul className="divide-y divide-line">
            {volunteers.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-sage">{item.email} · {item.interest} · {item.availability}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill value={item.status} />
                  <button type="button" className="text-xs font-semibold text-forest" onClick={() => setVolunteerId(item.id)}>Edit</button>
                  <button type="button" className="text-xs font-semibold text-ink" onClick={() => void deleteVolunteer(item.id).then(() => router.refresh()).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'The volunteer could not be removed.'))}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
